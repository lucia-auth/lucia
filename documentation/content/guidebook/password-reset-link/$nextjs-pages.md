---
title: "Password reset links in Next.js Pages Router"
description: "Learn how to implement password reset using reset links"
---

This guide expects access to the user's verified email. See [Sign in with email and password with verification links](/guidebook/email-verification-links/nextjs-pages) guide to learn how to verify the user's email, and email and password authentication in general.

```ts
// auth/lucia.ts
export const auth = lucia({
	adapter: ADAPTER,
	env: dev ? "DEV" : "PROD",
	middleware: nextjs_future(),

	getUserAttributes: (data) => {
		return {
			email: data.email,
			emailVerified: data.email_verified
		};
	}
});

export type Auth = typeof auth;
```

### Clone project

The [email and password Next.js example](https://github.com/lucia-auth/examples/tree/main/nextjs-pages/email-and-password) includes password reset.

```
npx degit lucia-auth/examples/nextjs-pages/email-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-pages/email-and-password).

## Database

### Password reset token

Create a new `password_reset_token` table. This will have 3 fields.

| name      | type                        | primary | references | description                         |
| --------- | --------------------------- | :-----: | ---------- | ----------------------------------- |
| `id`      | `string`                    |    ✓    |            | Token to send inside the reset link |
| `expires` | `bigint` (unsigned 8 bytes) |         |            | Expiration (in milliseconds)        |
| `user_id` | `string`                    |         | `user(id)` |                                     |

We'll be storing the expiration date as a `bigint` since Lucia uses handles expiration in milliseconds, but you can of course store it in seconds or the native `timestamp` type. Just make sure to adjust the expiration check accordingly.

## Password reset tokens

The token will be sent as part of the reset link.

```
http://localhost:3000/password-reset/<token>
```

When a user clicks the link, we prompt the user to enter their new password. When a user submits that form, we'll validate the token stored in the url and update the password of the user's key.

### Create new tokens

`generatePasswordResetToken()` will first check if a reset token already exists for the user. If it does, it will re-use the token if the expiration is over 1 hour away (half the expiration of 2 hours). If not, it will create a new token using [`generateRandomString()`](/reference/lucia/modules/utils#generaterandomstring) with a length of 63. The length is arbitrary, and anything around or longer than 64 characters should be sufficient (recommend minimum is 40).

```ts
// auth/token.ts
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generatePasswordResetToken = async (userId: string) => {
	const storedUserTokens = await db
		.table("password_reset_token")
		.where("user_id", "=", userId)
		.getAll();
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(63);
	await db
		.insertInto("password_reset_token")
		.values({
			id: token,
			expires: new Date().getTime() + EXPIRES_IN,
			user_id: userId
		})
		.executeTakeFirst();
	return token;
};
```

### Validate tokens

`validatePasswordResetToken()` will get the token and delete the token. We recommend handling this in a transaction or a batched query. It thens check the expiration with [`isWithinExpiration()`](/reference/lucia/modules/utils#iswithinexpiration), provided by Lucia, which checks if the current time is within the provided expiration time (in milliseconds).

It will throw if the token is invalid.

```ts
// auth/token.ts
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generatePasswordResetToken = async (userId: string) => {
	// ...
};

export const validatePasswordResetToken = async (token: string) => {
	const storedToken = await db.transaction().execute(async (trx) => {
		const storedToken = await trx
			.table("password_reset_token")
			.where("id", "=", token)
			.get();
		if (!storedToken) throw new Error("Invalid token");
		await trx
			.table("password_reset_token")
			.where("id", "=", storedToken.id)
			.delete();
		return storedToken;
	});
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		throw new Error("Expired token");
	}
	return storedToken.user_id;
};
```

## Send password reset link

Create `pages/password-reset/index.tsx` and add a form with an input for the email.

```tsx
// pages/password-reset/index.tsx
const Page = () => {
	return (
		<>
			<h1>Reset password</h1>
			<form
				method="post"
				action="/api/password-reset"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const response = await fetch("/api/password-reset", {
						method: "POST",
						body: JSON.stringify({
							email: formData.get("email")
						}),
						headers: {
							"Content-Type": "application/json"
						}
					});
				}}
			>
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<input type="submit" />
			</form>
		</>
	);
};

export default Page;
```

Create `pages/api/password-reset/index.ts` and handle POST requests.

Lucia allows us to use raw database queries when needed, for example checking the validity of an email. If the email is valid, create a new password reset link and send it to the user's inbox.

```ts
// pages/api/password-reset/index.ts`
import { auth } from "@/auth/lucia";
import { sendPasswordResetLink } from "@/auth/email";
import { generatePasswordResetToken } from "@/auth/verification-token";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
	const formData = await request.formData();
	const email = formData.get("email");
	// basic check
	if (!isValidEmail(email)) {
		return new Response(
			JSON.stringify({
				error: "Invalid email"
			}),
			{
				status: 400
			}
		);
	}
	try {
		const storedUser = await db
			.table("user")
			.where("email", "=", email.toLowerCase())
			.get();
		if (!storedUser) {
			return new Response(
				JSON.stringify({
					error: "User does not exist"
				}),
				{
					status: 400
				}
			);
		}
		const user = auth.transformDatabaseUser(storedUser);
		const token = await generatePasswordResetToken(user.userId);
		await sendPasswordResetLink(token);
		return new Response();
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: "An unknown error occurred"
			}),
			{
				status: 500
			}
		);
	}
};
```

## Reset password

Create `pages/password-reset/[token].tsx` and add a form with an input for the new password.

```tsx
// pages/password-reset/[token].tsx
import { useRouter } from "next/router";

const Page = () => {
	const router = useRouter();
	return (
		<>
			<h1>Sign in</h1>
			<form
				method="post"
				action={`/api/password-reset/${router.query.token}`}
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const response = await fetch(
						`/api/password-reset/${router.query.token}`,
						{
							method: "POST",
							body: JSON.stringify({
								password: formData.get("password")
							}),
							headers: {
								"Content-Type": "application/json"
							},
							redirect: "manual"
						}
					);

					if (response.status === 0) {
						// redirected
						// when using `redirect: "manual"`, response status 0 is returned
						return router.push("/");
					}
				}}
			>
				<label htmlFor="password">New Password</label>
				<input name="password" id="password" />
				<br />
				<input type="submit" />
			</form>
		</>
	);
};

export default Page;
```

Create `pages/api/password-reset/[token].ts` and handle POST requests.

Get the token from the url with `req.query.token` and validate it with `validatePasswordResetToken()`. Update the key password with [`Auth.updateKeyPassword()`](/reference/lucia/interfaces/auth#updatekeypassword), and optionally verify the user's email. **Make sure you invalidate all user sessions with [`Auth.invalidateAllUserSessions()`](/reference/lucia/interfaces/auth#invalidateallusersessions) before updating the password.**

```ts
// pages/api/password-reset/[token].ts
import { auth } from "@/auth/lucia";
import { validatePasswordResetToken } from "@/auth/verification-token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405).end();
	const { password } = req.body as {
		password: unknown;
	};
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return res.status(400).json({
			error: "Invalid password"
		});
	}
	try {
		const { token } = req.query as {
			token: string;
		};
		const userId = await validatePasswordResetToken(token);
		let user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateKeyPassword("email", user.email, password);
		if (!user.emailVerified) {
			user = await auth.updateUserAttributes(user.userId, {
				email_verified: Number(true)
			});
		}
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest({
			req,
			res
		});
		authRequest.setSession(session);
		return res.end();
	} catch (e) {
		return res.status(400).json({
			error: "Invalid or expired password reset link"
		});
	}
};

export default handler;
```
