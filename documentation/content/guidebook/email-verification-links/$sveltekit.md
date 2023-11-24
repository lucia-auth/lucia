---
title: "Email authentication with verification links in SvelteKit"
description: "Extend Lucia by implementing email and password authentication with email verification links"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started/sveltekit)._

If you're new to Lucia, we recommend starting with [Sign in with username and password](/guidebook/sign-in-with-username-and-password/sveltekit) starter guide as this guide will gloss over basic concepts and APIs. Make sure to implement password resets as well, which is covered in a separate guide (see [Password reset links](/guidebook/password-reset-link/sveltekit) guide).

This example project will have a few pages:

- `/signup`
- `/login`
- `/`: Profile page (protected)
- `/email-verification`: Confirmation + button to resend verification link

It will also have a route to handle verification links.

### Clone project

You can get started immediately by cloning the [SvelteKit example](https://github.com/lucia-auth/examples/tree/main/sveltekit/email-and-password) from the repository.

```
npx degit lucia-auth/examples/sveltekit/email-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/sveltekit/email-and-password).

## Database

### Update `user` table

Add a `email` (`string`, unique) and `email_verified` (`boolean`) column to the user table. Keep in mind that some database do not support boolean types (notably SQLite and MySQL), in which case it should be stored as an integer (1 or 0). Lucia _does not_ support default database values.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/server/lucia").Auth;
		type DatabaseUserAttributes = {
			email: string;
			email_verified: boolean;
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
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

We'll expose the user's email and verification status to the `User` object returned by Lucia's APIs.

```ts
// lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: ADAPTER,
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
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
http://localhost:5173/email-verification/<token>
```

When a user clicks the link, we validate of the token stored in the url and set `email_verified` user attributes to `true`.

### Create new tokens

`generateEmailVerificationToken()` will first check if a verification token already exists for the user. If it does, it will re-use the token if the expiration is over 1 hour away (half the expiration of 2 hours). If not, it will create a new token using [`generateRandomString()`](/reference/lucia/modules/utils#generaterandomstring) with a length of 63. The length is arbitrary, and anything around or longer than 64 characters should be sufficient (recommend minimum is 40).

```ts
// lib/server/token.ts
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
// lib/server/token.ts
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

Create `routes/signup/+page.svelte`. It will have a form with inputs for email and password.

```svelte
<!-- routes/signup/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<h1>Sign up</h1>
<form method="post" use:enhance>
	<label for="email">Email</label>
	<input name="email" id="email" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/login">Sign in</a>
```

### Create users

Create `routes/signup/+page.server.ts` and define a new form action.

When creating a user, use `"email"` as the provider id and the user's email as the provider user id. Make sure to set `email_verified` user property to `false`. We'll send a verification link when we create a new user, but we'll come back to that later. Redirect the user to the confirmation page (`/email-verification`).

```ts
// routes/signup/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";
import { generateEmailVerificationToken } from "$lib/server/token";
import { sendEmailVerificationLink } from "$lib/server/email";

import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get("email");
		const password = formData.get("password");
		// basic check
		if (!isValidEmail(email)) {
			return fail(400, {
				message: "Invalid email"
			});
		}
		if (
			typeof password !== "string" ||
			password.length < 6 ||
			password.length > 255
		) {
			return fail(400, {
				message: "Invalid password"
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
					email_verified: false // `Number(false)` if stored as an integer
				}
			});
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie

			const token = await generateEmailVerificationToken(user.userId);
			await sendEmailVerificationLink(token);
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
			return fail(500, {
				message: "An unknown error occurred"
			});
		}
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, "/email-verification");
	}
};
```

```ts
// lib/server/email.ts
export const sendEmailVerificationLink = async (email, token: string) => {
	const url = `http://localhost:5173/email-verification/${token}`;
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

### Redirect authenticated users

Create `routes/signup/+page.server.ts` and define a load function. Redirect authenticated users to the profile page if their email is verified, or to the confirmation page if not.

```ts
// routes/signup/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		if (!session.user.emailVerified) throw redirect(302, "/email-verification");
		throw redirect(302, "/");
	}
	return {};
};

export const actions: Actions = {
	// ...
};
```

## Sign in page

Create `routes/login/+page.svelte`. It will have a form with inputs for email and password.

```svelte
<!-- routes/login/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<h1>Sign in</h1>
<form method="post" use:enhance>
	<label for="email">Email</label>
	<input name="email" id="email" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/signup">Create an account</a>
```

### Authenticate users

Create `routes/login/+page.server.ts` and define a new form action.

Authenticate the user with `"email"` as the provider id and their email as the provider user id. Make sure to make the email lowercase before calling `useKey()`.

```ts
// routes/login/+page.server.ts
import { auth } from "$lib/server/lucia";
import { LuciaError } from "lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get("email");
		const password = formData.get("password");
		// basic check
		if (typeof email !== "string" || email.length < 1 || email.length > 255) {
			return fail(400, {
				message: "Invalid email"
			});
		}
		if (
			typeof password !== "string" ||
			password.length < 1 ||
			password.length > 255
		) {
			return fail(400, {
				message: "Invalid password"
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
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === "AUTH_INVALID_KEY_ID" ||
					e.message === "AUTH_INVALID_PASSWORD")
			) {
				// user does not exist
				// or invalid password
				return fail(400, {
					message: "Incorrect email or password"
				});
			}
			return fail(500, {
				message: "An unknown error occurred"
			});
		}
		// redirect to profile page
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, "/");
	}
};
```

### Redirect authenticated users

Create `routes/login/+page.server.ts`. Define a load function and implement redirects as we did in the sign up page.

```ts
// routes/login/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		if (!session.user.emailVerified) throw redirect(302, "/email-verification");
		throw redirect(302, "/");
	}
	return {};
};

export const actions: Actions = {
	// ...
};
```

## Confirmation page

Create `routes/email-verification/+page.svelte`. Users who just signed up and those without a verified email will be redirected to this page. It will include a form to resend the verification link.

```svelte
<!-- routes/email-verification/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<h1>Email verification</h1>
<p>Your email verification link was sent to your inbox (i.e. console).</p>
<h2>Resend verification link</h2>
<form method="post" use:enhance>
	<input type="submit" value="Resend" />
</form>
```

This page should only accessible to users whose email is not verified. Create `routes/email-verification/+page.server.ts` and define a load function to handle redirects.

```ts
// routes/email-verification/+page.server.ts
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/login");
	if (session.user.emailVerified) {
		throw redirect(302, "/");
	}
	return {};
};
```

### Resend verification link

Define a new form action in `routes/email-verification/+page.server.ts`. Redirect unauthenticated users and those who have already have a verified email. Create a new verification token and send the link to the user's inbox.

```ts
// routes/email-verification/+page.server.ts
import { redirect, fail } from "@sveltejs/kit";
import { generateEmailVerificationToken } from "$lib/server/token";
import { sendEmailVerificationLink } from "$lib/server/email";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// ...
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, "/login");
		if (session.user.emailVerified) {
			throw redirect(302, "/");
		}
		try {
			const token = await generateEmailVerificationToken(session.user.userId);
			await sendEmailVerificationLink(token);
			return {
				success: true
			};
		} catch {
			return fail(500, {
				message: "An unknown error occurred"
			});
		}
	}
};
```

## Verify email

Create `routes/email-verification/[token]/+server.ts`. This route will validate the token stored in url and verify the user's email. The token can be accessed from the url with `params`

Make sure to invalidate all sessions of the user.

```ts
// routes/email-verification/[token]/+server.ts
import { auth } from "$lib/server/lucia";
import { validateEmailVerificationToken } from "$lib/server/token";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
	const { token } = params;
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
		locals.auth.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch {
		return new Response("Invalid email verification link", {
			status: 400
		});
	}
};
```

## Protect pages

Protect normal pages (and form actions) by defining a load function in `+page.server.ts`, and redirecting unauthenticated users and those without a verified email.

```ts
// +page.server.ts
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/login");
	if (!session.user.emailVerified) {
		throw redirect(302, "/email-verification");
	}
	// ...
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, "/login");
		if (!session.user.emailVerified) {
			throw redirect(302, "/email-verification");
		}
		// ...
	}
};
```
