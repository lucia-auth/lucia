---
title: "Email authentication with verification links"
description: "Extend Lucia by implementing email and password authentication with email verification"
_order: "0"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started)._

If you're new to Lucia, we recommend starting with [Sign in with username and password]() starter guide as this guide will gloss over basic concepts and APIs. Make sure to implement password resets as well, which is covered in separate guide (see [Password reset]()).

This example project will have a few pages:

- `/signup`
- `/login`
- `/`: Profile page (protected)
- `/email-verification`: Confirmation + button to resend verification link

It will also have a route to handle verification links.

## Update your database

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

## Configure Lucia

Since we're dealing with the standard `Request` and `Response`, we'll use the [`web()`](/reference/lucia/middleware#web) middleware. We'll expose the user's email and verification status to the `User` object returned by Lucia's APIs.

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

## Sign up page

Create route `/signup`. `signup.html` will have a form with inputs for email and password

```html
<!-- signup.html -->
<h1>Sign up</h1>
<form method="post">
	<label for="email">Email</label>
	<input name="email" id="email" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/login">Sign in</a>
```

### Create users

This will be handled in a POST request.

When creating a user, use `"email"` as the provider id and the user's email as the provider user id. Make sure to set `email_verified` user property to `false`. We'll send a verification link when we create a new user, but we'll come back to that later.

```ts
import { auth } from "./lucia.js";

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
				providerUserId: email, // unique id when using "email" auth method
				password // hashed by Lucia
			},
			attributes: {
				email,
				email_verified: false // `Boolean(false)` if stored as an integer
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});

		// TODO: send verification link

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

### Validating emails

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

### Redirect authenticated users

Redirect authenticated users to the profile page if their email is verified, or to the confirmation page if not.

```ts
import { auth } from "./lucia.js";

get("/signup", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (session) {
		if (!session.user.emailVerified) {
			return new Response(null, {
				status: 302,
				headers: {
					Location: "/email-verification"
				}
			});
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/" // profile page
			}
		});
	}
	return renderPage();
});
```

## Sign in page

Create route `/login`. `login.html` will have a form with inputs for email and password.

```html
<!-- login.html -->
<h1>Sign in</h1>
<form method="post">
	<label for="email">Email</label>
	<input name="email" id="email" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/signup">Create an account</a>
```

### Authenticate users

This will be handled in a POST request. Authenticate the user with `"email"` as the provider id and their email as the provider user id.

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
		const user = await auth.useKey("email", email, password);
		const session = await auth.createSession({
			userId: user.userId,
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

### Redirect authenticated users

Implement redirects as we did in the sign up page.

```ts
import { auth } from "./lucia.js";

get("/login", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (session) {
		if (!session.user.emailVerified) {
			return new Response(null, {
				status: 302,
				headers: {
					Location: "/email-verification"
				}
			});
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/" // profile page
			}
		});
	}
	return renderPage();
});
```

## Email verification tokens

### Database

Create a new `email_verification_token` table. This will have 3 fields.

| name      | type                        | primary | references | description                                |
| --------- | --------------------------- | :-----: | ---------- | ------------------------------------------ |
| `id`      | `string`                    |         |            | Token to send inside the verification link |
| `expires` | `bigint` (unsigned 8 bytes) |    ✓    |            | Expiration (in milliseconds)               |
| `user_id` | `string`                    |         | `user(id)` |                                            |

We'll be storing the expiration date as a `bigint` since Lucia uses handles expiration in milliseconds, but you can of course store it in seconds or the native `timestamp` type. Just make sure to adjust the expiration check accordingly.

### Create new tokens

`generateEmailVerificationToken()` will first check if a verification token already exists for the user. If it does, it will re-use the token if the expiration is over 1 hour away (half the expiration of 2 hours). If not, it will create a new token with a length of 63. The length is arbitrary, and anything around or longer than 64 characters should be sufficient (recommend minimum is 40).

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

`validateEmailVerificationToken()` will get the token and delete it if it exists. We recommend handling this in a transaction or a batched query. It will throw if the token is invalid.

```ts
const validateEmailVerificationToken = async (token: string) => {
	const storedToken = await db.transaction(async (trx) => {
		const storedToken = await trx
			.table("email_verification_token")
			.where("id", "=", token)
			.get();
		if (!storedToken) throw new Error("Invalid token");
		await trx
			.table("email_verification_token")
			.where("id", "=", token)
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

## Send email verification link

Return back to `/signup` and send the verification link. Redirect the user to the confirmation page (`/email-verification`).

```ts
import { auth } from "./lucia.js";

post("/signup", async (request: Request) => {
	// ...
	try {
		// ...
		const sessionCookie = auth.createSessionCookie(session);

		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(email, token);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/email-verification"
			}
		});
	} catch {
		// ...
	}
});
```

The verification link is `http://localhost:<port>/email-verification/<token>`.

```ts
const sendEmailVerificationLink = async (email, token: string) => {
	const url = `http://localhost:3000/email-verification/${token}`;
	await sendEmail(email, {
		// ...
	});
};
```

## Confirmation page

Create route `/email-verification`. Users who just signed up will be redirected to this page, and will include a form to resend the verification link. Users without a verified email will also be redirected to this page.

```html
<!-- email-verification.html -->
<h1>Email verification</h1>
<p>Your email verification link was sent to your inbox.</p>
<h2>Resend verification link</h2>
<form method="post">
	<input type="submit" value="Resend" />
</form>
```

This page should only accessible to users whose email is not verified.

```ts
import { auth } from "./lucia.js";

get("/email-verification", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login"
			}
		});
	}
	if (session.user.emailVerified) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/" // profile page
			}
		});
	}
	return renderPage();
});
```

### Resend verification link

Handle POST requests. Check if the user is authenticated and if the user already has a verified email. Create a verification token and send it to the email stored in the user.

```ts
import { auth } from "./lucia.js";

post("/email-verification", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login"
			}
		});
	}
	if (session.user.emailVerified) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/" // profile page
			}
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

## Email verification link

Create `/email-verification/<token>`, where `<token>` is a dynamic route params. This route will handle users who clicked the verification link.

```ts
import { auth } from "./lucia.js";

get("/email-verification/:token", async (request: Request) => {
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

## Profile page

Redirect unauthenticated users and those without a verified email.

```ts
import { auth } from "./lucia.js";

get("/", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login"
			}
		});
	}
	if (!session.user.emailVerified) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/email-verification"
			}
		});
	}
	return renderPage();
});
```

See the [Sign in with username and password]() guide on handling sign out.
