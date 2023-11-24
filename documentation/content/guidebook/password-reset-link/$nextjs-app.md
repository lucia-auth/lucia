---
title: "Password reset links in Next.js App Router"
description: "Learn how to implement password reset using reset links"
---

This guide expects access to the user's verified email. See [Sign in with email and password with verification links](/guidebook/email-verification-links/nextjs-app) guide to learn how to verify the user's email, and email and password authentication in general.

```ts
// auth/lucia.ts
export const auth = lucia({
	adapter: ADAPTER,
	env: dev ? "DEV" : "PROD",
	middleware: nextjs_future(),
	sessionCookie: {
		expires: false
	},

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

The [email and password Next.js example](https://github.com/lucia-auth/examples/tree/main/nextjs-app/email-and-password) includes password reset.

```
npx degit lucia-auth/examples/nextjs-app/email-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-app/email-and-password).

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

## Form component

Since the form will require client side JS, we will extract it into its own client component. We need to manually handle redirect responses as the default behavior is to make another request to the redirect location. We're going to use `refresh()` to reload the page (and redirect the user in the server) since we want to re-render the entire page, including `layout.tsx`.

```tsx
// components/form.tsx
import { useRouter } from "next/navigation";

const Form = (props: { children: React.ReactNode; action: string }) => {
	const router = useRouter();
	return (
		<>
			<form
				action={props.action}
				method="post"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const response = await fetch(props.action, {
						method: "POST",
						body: formData,
						redirect: "manual"
					});
					if (response.status === 0) {
						// redirected
						// when using `redirect: "manual"`, response status 0 is returned
						return router.refresh();
					}
				}}
			>
				{props.children}
			</form>
		</>
	);
};

export default Form;
```

## Send password reset link

Create `app/password-reset/page.tsx` and add a form with an input for the email.

```tsx
// app/password-reset/page.tsx
import Form from "@/components/form";

const Page = async () => {
	return (
		<>
			<h1>Reset password</h1>
			<Form action="/api/password-reset">
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<input type="submit" />
			</Form>
		</>
	);
};

export default Page;
```

Create `app/api/password-reset/route.ts` and handle POST requests.

Lucia allows us to use raw database queries when needed, for example checking the validity of an email. If the email is valid, create a new password reset link and send it to the user's inbox.

```ts
// app/api/password-reset/route.ts
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

Create `app/password-reset/[token]/page.tsx` and add a form with an input for the new password.

```tsx
// app/password-reset/[token]/page.tsx
import Form from "@/components/form";

const Page = async ({
	params
}: {
	params: {
		token: string;
	};
}) => {
	return (
		<>
			<h1>Reset password</h1>
			<Form action={`/api/password-reset/${params.token}`}>
				<label htmlFor="password">New Password</label>
				<input name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
		</>
	);
};

export default Page;
```

Create `app/api/password-reset/[token]/route.ts` and handle POST requests.

Get the token from the url with `params.token` and validate it with `validatePasswordResetToken()`. Update the key password with [`Auth.updateKeyPassword()`](/reference/lucia/interfaces/auth#updatekeypassword), and optionally verify the user's email. **Make sure you invalidate all user sessions with [`Auth.invalidateAllUserSessions()`](/reference/lucia/interfaces/auth#invalidateallusersessions) before updating the password.**

```ts
// app/api/password-reset/[token]/route.ts
import { auth } from "@/auth/lucia";
import { validatePasswordResetToken } from "@/auth/verification-token";

import type { NextRequest } from "next/server";

export const POST = async (
	request: NextRequest,
	{
		params
	}: {
		params: {
			token: string;
		};
	}
) => {
	const formData = await request.formData();
	const password = formData.get("password");
	// basic check
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return new Response(
			JSON.stringify({
				error: "Invalid password"
			}),
			{
				status: 400
			}
		);
	}
	try {
		const { token } = params;
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
		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: "Invalid or expired password reset link"
			}),
			{
				status: 400
			}
		);
	}
};
```
