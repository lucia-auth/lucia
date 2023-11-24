---
title: "Email authentication with verification links in Next.js Pages Router"
description: "Extend Lucia by implementing email and password authentication with email verification links"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started)._

If you're new to Lucia, we recommend starting with [Sign in with username and password](/guidebook/sign-in-with-username-and-password/nextjs-pages) starter guide as this guide will gloss over basic concepts and APIs. Make sure to implement password resets as well, which is covered in a separate guide (see [Password reset links](/guidebook/password-reset-link/nextjs-pages) guide).

This example project will have a few pages:

- `/signup`
- `/login`
- `/`: Profile page (protected)
- `/email-verification`: Confirmation + button to resend verification link

It will also have a route to handle verification links.

### Clone project

You can get started immediately by cloning the [Next.js example](https://github.com/lucia-auth/examples/tree/main/nextjs-pages/email-and-password) from the repository.

```
npx degit lucia-auth/examples/nextjs-pages/email-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-pages/email-and-password).

## Database

### Update `user` table

Add a `email` (`string`, unique) and `email_verified` (`boolean`) column to the user table. Keep in mind that some database do not support boolean types (notably SQLite and MySQL), in which case it should be stored as an integer (1 or 0). Lucia _does not_ support default database values.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("@/auth/lucia").Auth;
	type DatabaseUserAttributes = {
		email: string;
		email_verified: number;
	};
	type DatabaseSessionAttributes = {};
}
```

### Email verification tokens

Create a new `email_verification_token` table. This will have 3 fields.

| name      | type                        | primary | references | description                                |
| --------- | --------------------------- | :-----: | ---------- | ------------------------------------------ |
| `id`      | `string`                    |    ✓    |            | Token to send inside the verification link |
| `expires` | `bigint` (unsigned 8 bytes) |         |            | Expiration (in milliseconds)               |
| `user_id` | `string`                    |         | `user(id)` |                                            |

We'll be storing the expiration date as a `bigint` since Lucia uses handles expiration in milliseconds, but you can of course store it in seconds or the native `timestamp` type. Just make sure to adjust the expiration check accordingly.

## Configure Lucia

We'll expose the user's email and verification status to the `User` object returned by Lucia's APIs.

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs_future(),
	getUserAttributes: (data) => {
		return {
			email: data.email,
			emailVerified: data.email_verified // `Boolean(data.email_verified)` if stored as an integer
		};
	}
});

export type Auth = typeof auth;
```

## Email verification tokens

The token will be sent as part of the verification link.

```
http://localhost:3000/api/email-verification/<token>
```

When a user clicks the link, we validate of the token stored in the url and set `email_verified` user attributes to `true`.

### Create new tokens

`generateEmailVerificationToken()` will first check if a verification token already exists for the user. If it does, it will re-use the token if the expiration is over 1 hour away (half the expiration of 2 hours). If not, it will create a new token using [`generateRandomString()`](/reference/lucia/modules/utils#generaterandomstring) with a length of 63. The length is arbitrary, and anything around or longer than 64 characters should be sufficient (recommend minimum is 40).

```ts
// auth/token.ts
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string) => {
	const storedUserTokens = await db
		.table("email_verification_token")
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
	await db.table("email_verification_token").insert({
		id: token,
		expires: new Date().getTime() + EXPIRES_IN,
		user_id: userId
	});

	return token;
};
```

### Validate tokens

`validateEmailVerificationToken()` will get the token and delete all tokens belonging to the user (which includes the used token). We recommend handling this in a transaction or a batched query. It thens check the expiration with [`isWithinExpiration()`](/reference/lucia/modules/utils#iswithinexpiration), provided by Lucia, which checks if the current time is within the provided expiration time (in milliseconds).

It will throw if the token is invalid.

```ts
// auth/token.ts
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string) => {
	// ...
};

export const validateEmailVerificationToken = async (token: string) => {
	const storedToken = await db.transaction(async (trx) => {
		const storedToken = await trx
			.table("email_verification_token")
			.where("id", "=", token)
			.get();
		if (!storedToken) throw new Error("Invalid token");
		await trx
			.table("email_verification_token")
			.where("user_id", "=", storedToken.user_id)
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

## Sign up page

Create `pages/signup.tsx`. It will have a form with inputs for email and password. We need to manually handle redirect responses as the default behavior is to make another request to the redirect location.

Redirect authenticated users to the profile page if their email is verified, or to the confirmation page if not.

```tsx
// pages/signup.tsx
import { useRouter } from "next/router";
import { auth } from "@/auth/lucia";

import Link from "next/link";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (session) {
		if (!session.user.emailVerified) {
			return {
				redirect: {
					destination: "/email-verification",
					permanent: false
				}
			};
		}
		return {
			redirect: {
				destination: "/",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

const Page = () => {
	const router = useRouter();
	return (
		<>
			<h1>Sign up</h1>
			<form
				method="post"
				action="/api/signup"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const response = await fetch("/api/signup", {
						method: "POST",
						body: JSON.stringify({
							email: formData.get("email"),
							password: formData.get("password")
						}),
						headers: {
							"Content-Type": "application/json"
						},
						redirect: "manual"
					});
					if (response.status === 0) {
						// redirected
						// when using `redirect: "manual"`, response status 0 is returned
						return router.push("/");
					}
				}}
			>
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</form>
			<Link href="/login">Sign in</Link>
		</>
	);
};

export default Page;
```

### Create users

Create `pages/api/signup.ts` and handle POST requests.

When creating a user, use `"email"` as the provider id and the user's email as the provider user id. Make sure to set `email_verified` user property to `false`. After creating a user, send the email verification link to the user's inbox. Redirect the user to the confirmation page (`/email-verification`).

```ts
// pages/api/signup.ts
import { isValidEmail, sendEmailVerificationLink } from "@/auth/email";
import { auth } from "@/auth/lucia";
import { generateEmailVerificationToken } from "@/auth/token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405);
	const { email, password } = req.body as {
		email: unknown;
		password: unknown;
	};
	// basic check
	if (!isValidEmail(email)) {
		return res.status(400).json({
			error: "Invalid email"
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		return res.status(400).json({
			error: "Invalid password"
		});
	}
	try {
		const user = await auth.createUser({
			key: {
				providerId: "email", // auth method
				providerUserId: email.toLowerCase(), // unique id when using "email" auth method
				password // hashed by Lucia
			},
			attributes: {
				email: email.toLowerCase(),
				email_verified: Number(false)
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest({
			req,
			res
		});
		authRequest.setSession(session);

		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(token);

		return res.redirect(302, "/email-verification");
	} catch (e) {
		// this part depends on the database you're using
		// check for unique constraint error in user table
		if (
			e instanceof SomeDatabaseError &&
			e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
		) {
			return res.status(400).json({
				error: "Account already exists"
			});
		}

		return res.status(500).json({
			error: "An unknown error occurred"
		});
	}
};

export default handler;
```

```ts
// auth/email.ts
export const sendEmailVerificationLink = async (email, token: string) => {
	const url = `http://localhost:3000/api/email-verification/${token}`;
	await sendEmail(email, {
		// ...
	});
};
```

#### Validating emails

Validating emails are notoriously hard as the RFC defining them is rather complicated. Here, we're checking:

- There's one `@`
- There's at least a single character before `@`
- There's at least a single character after `@`
- No longer than 255 characters

You can check if a `.` exists, but keep in mind `https://com.` is a valid url/domain.

```ts
const isValidEmail = (maybeEmail: unknown): maybeEmail is string => {
	if (typeof maybeEmail !== "string") return false;
	if (maybeEmail.length > 255) return false;
	const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]
	return emailRegexp.test(maybeEmail);
};
```

## Sign in page

Create `pages/login.tsx`. It will have a form with inputs for email and password. Implement redirects as we did in the sign up page.

```tsx
// pages/login.tsx
import { useRouter } from "next/router";
import { auth } from "@/auth/lucia";

import Link from "next/link";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (session) {
		if (!session.user.emailVerified) {
			return {
				redirect: {
					destination: "/email-verification",
					permanent: false
				}
			};
		}
		return {
			redirect: {
				destination: "/",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

const Page = () => {
	const router = useRouter();
	return (
		<>
			<h1>Sign in</h1>
			<form
				method="post"
				action="/api/login"
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage(null);
					const formData = new FormData(e.currentTarget);
					const response = await fetch("/api/login", {
						method: "POST",
						body: JSON.stringify({
							email: formData.get("email"),
							password: formData.get("password")
						}),
						headers: {
							"Content-Type": "application/json"
						},
						redirect: "manual"
					});

					if (response.status === 0) {
						// redirected
						// when using `redirect: "manual"`, response status 0 is returned
						return router.push("/");
					}
				}}
			>
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</form>
			<Link href="/signup">Create an account</Link>
		</>
	);
};

export default Page;
```

### Authenticate users

Create `pages/api/login.ts` and handle POST requests.

Authenticate the user with `"email"` as the provider id and their email as the provider user id. Make sure to make the email lowercase before calling `useKey()`.

```ts
// pages/api/login.ts
import { auth } from "@/auth/lucia";
import * as context from "next/headers";
import { NextResponse } from "next/server";
import { LuciaError } from "lucia";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");
	// basic check
	if (typeof email !== "string" || email.length < 1 || email.length > 255) {
		return NextResponse.json(
			{
				error: "Invalid email"
			},
			{
				status: 400
			}
		);
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		return NextResponse.json(
			{
				error: "Invalid password"
			},
			{
				status: 400
			}
		);
	}
	try {
		// find user by key
		// and validate password
		const key = await auth.useKey("email", email.toLowerCase(), password);
		const session = await auth.createSession({
			userId: key.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest({
			request,
			cookies
		});
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/" // redirect to profile page
			}
		});
	} catch (e) {
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			// user does not exist
			// or invalid password
			return NextResponse.json(
				{
					error: "Incorrect email or password"
				},
				{
					status: 400
				}
			);
		}
		return NextResponse.json(
			{
				error: "An unknown error occurred"
			},
			{
				status: 500
			}
		);
	}
};
```

## Confirmation page

Create `pages/email-verification.tsx`. Users who just signed up and those without a verified email will be redirected to this page. It will include a form to resend the verification link.

This page should only accessible to users whose email is not verified.

```tsx
// pages/email-verification.tsx
import { auth } from "@/auth/lucia";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (!session) {
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	}
	if (session.user.emailVerified) {
		return {
			redirect: {
				destination: "/",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

const Page = () => {
	return (
		<>
			<h1>Email verification</h1>
			<p>Your email verification link was sent to your inbox (i.e. console).</p>
			<h2>Resend verification link</h2>
			<form
				method="post"
				action="/api/email-verification"
				onSubmit={async (e) => {
					e.preventDefault();
					await fetch("/api/email-verification", {
						method: "POST"
					});
				}}
			>
				<input type="submit" value="Resend" />
			</form>
		</>
	);
};

export default Page;
```

### Resend verification link

Create `pages/api/email-verification/index.ts` and handle POST requests. Create a new verification token and send the link to the user's inbox.

```ts
// pages/api/email-verification/index.ts
import { auth } from "@/auth/lucia";
import { generateEmailVerificationToken } from "@/auth/verification-token";
import { sendEmailVerificationLink } from "@/auth/email";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405).end();
	const authRequest = auth.handleRequest({
		req,
		res
	});
	const session = await authRequest.validate();
	if (!session) return res.status(401).end();
	if (session.user.emailVerified) {
		return res.status(422).json({
			error: "Email already verified"
		});
	}
	try {
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(token);
		return res.end();
	} catch {
		return res.status(500).json({
			error: "An unknown error occurred"
		});
	}
};

export default handler;
```

## Verify email

Create `pages/api/email-verification/[token].ts` and handle GET requests. This route will validate the token stored in url and verify the user's email. The token can be accessed from the url with `req.query`.

Make sure to invalidate all sessions of the user.

```ts
// pages/api/email-verification/[token].ts
import { auth } from "@/auth/lucia";
import { validateEmailVerificationToken } from "@/auth/verification-token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET") return res.status(405).end();
	const { token } = req.query as {
		token: string;
	};
	try {
		const userId = await validateEmailVerificationToken(token);
		const user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateUserAttributes(user.userId, {
			email_verified: Number(true)
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest({
			req,
			res
		});
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end();
	} catch {
		return res.status(400).send("Invalid email verification link");
	}
};

export default handler;
```

## Protect pages

Protect all other pages and API routes by redirecting unauthenticated users and those without a verified email.

```tsx
import { auth } from "@/auth/lucia";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<
	GetServerSidePropsResult<{
		userId: string;
		email: string;
	}>
> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (!session) {
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	}
	if (!session.user.emailVerified) {
		return {
			redirect: {
				destination: "/email-verification",
				permanent: false
			}
		};
	}
	// ...
};
```

```ts
import { auth } from "@/auth/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const authRequest = auth.handleRequest({
		req,
		res
	});
	const session = await authRequest.validate();
	if (!session) return res.status(401).end();
	if (!session.user.emailVerified) {
		return res.status(403).end();
	}
	// ...
};

export default handler;
```
