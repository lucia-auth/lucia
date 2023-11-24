---
title: "Email authentication with verification links"
description: "Extend Lucia by implementing email and password authentication with email verification links"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started)._

If you're new to Lucia, we recommend starting with [Sign in with username and password](/guidebook/sign-in-with-username-and-password) starter guide as this guide will gloss over basic concepts and APIs. Make sure to implement password resets as well, which is covered in a separate guide (see [Password reset links](/guidebook/password-reset-link) guide).

## Database

### Update `user` table

Add a `email` (`string`, unique) and `email_verified` (`boolean`) column to the user table. Keep in mind that some database do not support boolean types (notably SQLite and MySQL), in which case it should be stored as an integer (1 or 0). Lucia _does not_ support default database values.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type DatabaseUserAttributes = {
		email: string;
		email_verified: boolean;
	};
	type DatabaseSessionAttributes = {};
}
```

### Email verification token

Create a new `email_verification_token` table. This will have 3 fields.

| name      | type                        | primary | references | description                                |
| --------- | --------------------------- | :-----: | ---------- | ------------------------------------------ |
| `id`      | `string`                    |    ✓    |            | Token to send inside the verification link |
| `expires` | `bigint` (unsigned 8 bytes) |         |            | Expiration (in milliseconds)               |
| `user_id` | `string`                    |         | `user(id)` |                                            |

We'll be storing the expiration date as a `bigint` since Lucia uses handles expiration in milliseconds, but you can of course store it in seconds or the native `timestamp` type. Just make sure to adjust the expiration check accordingly.

## Configure Lucia

Since we're dealing with the standard `Request` and `Response`, we'll use the [`web()`](/reference/lucia/modules/middleware#web) middleware. We'll expose the user's email and verification status to the `User` object returned by Lucia's APIs.

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production
	middleware: web(),
	sessionCookie: {
		expires: false
	},

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
http://localhost:<port>/email-verification/<token>
```

When a user clicks the link, we validate of the token stored in the url and set `email_verified` user attributes to `true`.

### Create new tokens

`generateEmailVerificationToken()` will first check if a verification token already exists for the user. If it does, it will re-use the token if the expiration is over 1 hour away (half the expiration of 2 hours). If not, it will create a new token using [`generateRandomString()`](/reference/lucia/modules/utils#generaterandomstring) with a length of 63. The length is arbitrary, and anything around or longer than 64 characters should be sufficient (recommend minimum is 40).

```ts
// token.ts
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
// token.ts
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

## Sign up user

### Create users

When creating a user, use `"email"` as the provider id and the user's email as the provider user id. Make sure to set `email_verified` user property to `false`. We'll send a verification link when we create a new user, but we'll come back to that later. Redirect the user to the confirmation page (`/email-verification`).

```ts
import { auth } from "./lucia.js";
import { generateEmailVerificationToken } from "./token.js";
import { sendEmailVerificationLink } from "./email.js";

post("/signup", async (request: Request) => {
	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");
	// basic check
	if (!isValidEmail(email)) {
		return new Response("Invalid email", {
			status: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return new Response("Invalid password", {
			status: 400
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
				email_verified: false // `Boolean(false)` if stored as an integer
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});

		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(token);

		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			headers: {
				Location: "/", // profile page
				"Set-Cookie": sessionCookie.serialize() // store session cookie
			},
			status: 302
		});
	} catch (e) {
		// this part depends on the database you're using
		// check for unique constraint error in user table
		if (
			e instanceof SomeDatabaseError &&
			e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
		) {
			return new Response("Account already exists", {
				status: 400
			});
		}

		return new Response("An unknown error occurred", {
			status: 500
		});
	}
});
```

```ts
// email.ts
export const sendEmailVerificationLink = async (email, token: string) => {
	const url = `http://localhost:3000/email-verification/${token}`;
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

## Sign in user

### Authenticate users

Authenticate the user with `"email"` as the provider id and their email as the provider user id.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

post("/login", async (request: Request) => {
	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");
	// basic check
	if (typeof email !== "string" || email.length < 1 || email.length > 255) {
		return new Response("Invalid email", {
			status: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		return new Response("Invalid password", {
			status: 400
		});
	}
	try {
		// find user by key
		// and validate password
		const key = await auth.useKey("email", email.toLowerCase(), password);
		const session = await auth.createSession({
			userId: key.userId,
			attributes: {}
		});
		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			headers: {
				Location: "/", // profile page
				"Set-Cookie": sessionCookie.serialize() // store session cookie
			},
			status: 302
		});
	} catch (e) {
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			// user does not exist
			// or invalid password
			return new Response("Incorrect email of password", {
				status: 400
			});
		}
		return new Response("An unknown error occurred", {
			status: 500
		});
	}
});
```

## Resend verification link

Redirect unauthenticated users and those who have already have a verified email. Create a new verification token and send the link to the user's inbox.

```ts
import { auth } from "@/auth/lucia";
import { generateEmailVerificationToken } from "./token.js";
import { sendEmailVerificationLink } from "./email.js";

post("/email-verification", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		return new Response(null, {
			status: 401
		});
	}
	if (session.user.emailVerified) {
		// email already verified
		return new Response(null, {
			status: 422
		});
	}
	try {
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(session.user.email, token);
		return new Response();
	} catch {
		return new Response("An unknown error occurred", {
			status: 500
		});
	}
});
```

## Verify email

Create route `/email-verification/<token>`, where `<token>` is a dynamic route params. This route will validate the token stored in url and verify the user's email.

Make sure to invalidate all sessions of the user.

```ts
import { auth } from "./lucia.js";
import { validateEmailVerificationToken } from "./token.js";

get("/email-verification/[token]", async (request: Request) => {
	const token = getTokenParams(request.url);
	try {
		const userId = await validateEmailVerificationToken(token);
		const user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateUserAttributes(user.userId, {
			email_verified: true // `Number(true)` if stored as an integer
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/", // profile page
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	} catch {
		return new Response("Invalid email verification link", {
			status: 400
		});
	}
});
```
