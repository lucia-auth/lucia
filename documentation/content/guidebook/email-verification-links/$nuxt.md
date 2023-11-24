---
title: "Email authentication with verification links in Nuxt"
description: "Extend Lucia by implementing email and password authentication with email verification links"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started)._

If you're new to Lucia, we recommend starting with [Sign in with username and password](/guidebook/sign-in-with-username-and-password/nuxt) starter guide as this guide will gloss over basic concepts and APIs. Make sure to implement password resets as well, which is covered in a separate guide (see [Password reset links](/guidebook/password-reset-link/nuxt) guide).

This example project will have a few pages:

- `/signup`
- `/login`
- `/`: Profile page (protected)
- `/email-verification`: Confirmation + button to resend verification link

It will also have a route to handle verification links.

### Clone project

You can get started immediately by cloning the [Nuxt example](https://github.com/lucia-auth/examples/tree/main/nuxt/email-and-password) from the repository.

```
npx degit lucia-auth/examples/nuxt/email-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nuxt/email-and-password).

## Database

### Update `user` table

Add a `email` (`string`, unique) and `email_verified` (`boolean`) column to the user table. Keep in mind that some database do not support boolean types (notably SQLite and MySQL), in which case it should be stored as an integer (1 or 0). Lucia _does not_ support default database values.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// server/app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./utils/lucia").Auth;
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
// server/utils/lucia.ts
import { lucia } from "lucia";
import { h3 } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.dev ? "DEV" : "PROD",
	middleware: h3(),
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
// server/utils/token.ts
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
// server/utils/token.ts
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

## Managing auth state

### Get authenticated user

Create `server/api/user.get.ts`. This endpoint will return the current user. You can validate requests by creating by calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```ts
// server/api/user.get.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	return {
		user: session?.user ?? null;
	}
});
```

### Composables

Create `useUser()` and `useAuthenticatedUser()` composables. `useUser()` will return the current user. `useAuthenticatedUser()` can only be used inside protected routes, which allows the ref value type to be always defined (never `null`).

```ts
// composables/auth.ts
import type { User } from "lucia";

export const useUser = () => {
	const user = useState<User | null>("user", () => null);
	return user;
};

export const useAuthenticatedUser = () => {
	const user = useUser();
	return computed(() => {
		const userValue = unref(user);
		if (!userValue) {
			throw createError(
				"useAuthenticatedUser() can only be used in protected pages"
			);
		}
		return userValue;
	});
};
```

### Define middleware

Define a global `auth` middleware that gets the current user and populates the user state. This will run on every navigation.

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();
	const { data, error } = await useFetch("/api/user");
	if (error.value) throw createError("Failed to fetch data");
	user.value = data.value?.user ?? null;
});
```

Next, define a regular `protected` middleware that redirects unauthenticated users to the login page.

```ts
// middleware/protected.ts
export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();
	if (!user.value) return navigateTo("/login");
});
```

## Sign up page

Create `pages/signup.vue`. It will have a form with inputs for email and password. We need to manually handle redirect responses as the default behavior is to make another request to the redirect location.

Redirect authenticated users to the profile page if their email is verified, or to the confirmation page if not.

```vue
<!-- pages/signup.vue -->
<script lang="ts" setup>
const user = useUser();
if (user.value) {
	if (user.value.emailVerified) {
		await navigateTo("/email-verification");
	} else {
		await navigateTo("/"); // redirect to profile page
	}
}

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	await $fetch("/api/signup", {
		method: "POST",
		body: {
			email: formData.get("email"),
			password: formData.get("password")
		},
		redirect: "manual"
	});
	await navigateTo("/"); // profile page
};
</script>

<template>
	<h1>Sign up</h1>
	<form method="post" action="/api/signup" @submit.prevent="handleSubmit">
		<label for="email">Email</label>
		<input name="email" id="email" /><br />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" /><br />
		<input type="submit" />
	</form>
	<NuxtLink to="/login">Sign in</NuxtLink>
</template>
```

### Create users

Create `server/api/signup.post.ts`.

When creating a user, use `"email"` as the provider id and the user's email as the provider user id. Make sure to set `email_verified` user property to `false`. After creating a user, send the email verification link to the user's inbox. Redirect the user to the confirmation page (`/email-verification`).

```ts
// server/api/signup.post.ts
import { SqliteError } from "better-sqlite3";

export default defineEventHandler(async (event) => {
	const { email, password } = await readBody<{
		email: unknown;
		password: unknown;
	}>(event);
	// basic check
	if (!isValidEmail(email)) {
		throw createError({
			message: "Invalid email",
			statusCode: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		throw createError({
			message: "Invalid password",
			statusCode: 400
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
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(token);
		return sendRedirect(event, "/email-verification");
	} catch (e) {
		// this part depends on the database you're using
		// check for unique constraint error in user table
		if (
			e instanceof SomeDatabaseError &&
			e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
		) {
			throw createError({
				message: "Account already exists",
				statusCode: 400
			});
		}
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
```

```ts
// server/utils/email.ts
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

Create `pages/login.vue`. It will have a form with inputs for email and password. Implement redirects as we did in the sign up page.

```vue
<!-- pages/login.vue -->
<script lang="ts" setup>
const user = useUser();
if (user.value) {
	if (user.value.emailVerified) {
		await navigateTo("/email-verification");
	} else {
		await navigateTo("/"); // redirect to profile page
	}
}

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	await $fetch("/api/login", {
		method: "POST",
		body: {
			email: formData.get("email"),
			password: formData.get("password")
		},
		redirect: "manual"
	});
	await navigateTo("/"); // profile page
};
</script>

<template>
	<h1>Sign in</h1>
	<form method="post" action="/api/login" @submit.prevent="handleSubmit">
		<label for="email">Email</label>
		<input name="email" id="email" /><br />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" /><br />
		<input type="submit" />
	</form>
	<NuxtLink to="/signup">Create an account</NuxtLink>
</template>
```

### Authenticate users

Create `server/api/login.post.ts` and handle POST requests.

Authenticate the user with `"email"` as the provider id and their email as the provider user id. Make sure to make the email lowercase before calling `useKey()`.

```ts
// server/api/login.post.ts
import { LuciaError } from "lucia";

export default defineEventHandler(async (event) => {
	const { email, password } = await readBody<{
		email: unknown;
		password: unknown;
	}>(event);
	// basic check
	if (typeof email !== "string" || email.length < 1 || email.length > 255) {
		throw createError({
			message: "Invalid email",
			statusCode: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		throw createError({
			message: "Invalid password",
			statusCode: 400
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
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return sendRedirect(event, "/"); // redirect to profile page
	} catch (e) {
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			// user does not exist
			// or invalid password
			throw createError({
				message: "Incorrect email or password",
				statusCode: 400
			});
		}
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
```

## Confirmation page

Create `pages/email-verification.vue`. Users who just signed up and those without a verified email will be redirected to this page. It will include a form to resend the verification link.

This page should only accessible to users whose email is not verified.

```vue
<!-- pages/email-verification.vue -->
<script lang="ts" setup>
definePageMeta({
	middleware: ["protected"]
});

const user = useAuthenticatedUser();

if (user.value.emailVerified) {
	await navigateTo("/");
}

const handleResend = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	await $fetch("/api/email-verification", {
		method: "POST",
		redirect: "manual"
	});
};
</script>

<template>
	<h1>Email verification</h1>
	<p>Your email verification link was sent to your inbox (i.e. console).</p>
	<h2>Resend verification link</h2>
	<form
		method="post"
		action="/api/email-verification"
		@submit.prevent="handleResend"
	>
		<input type="submit" value="Resend" />
	</form>
</template>
```

### Resend verification link

Create `server/api/email-verification/index.post.ts` and handle POST requests. Create a new verification token and send the link to the user's inbox.

```ts
// server/api/email-verification/index.post.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) {
		throw createError({
			status: 401
		});
	}
	if (session.user.emailVerified) {
		throw createError({
			status: 422,
			message: "Email already verified"
		});
	}
	try {
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(token);
		return {};
	} catch {
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
```

## Verify email

Create `server/api/email-verification/[token].get.ts This route will validate the token stored in url and verify the user's email. The token can be accessed from the url with `event.context.params`.

Make sure to invalidate all sessions of the user.

```ts
// server/api/email-verification/[token].get.ts
export default defineEventHandler(async (event) => {
	const { token } = event.context.params ?? {
		token: ""
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
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return sendRedirect(event, "/");
	} catch {
		throw createError({
			status: 400,
			message: "Invalid email verification link"
		});
	}
});
```

## Protect pages

Protect all other pages and API routes by redirecting unauthenticated users and those without a verified email.

```vue
<script lang="ts" setup>
definePageMeta({
	middleware: ["protected"]
});

const user = useAuthenticatedUser();

if (!user.value.emailVerified) {
	await navigateTo("/email-verification");
}

// ...
</script>

<template></template>
```

```ts
// api routes
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) {
		throw createError({
			message: "Unauthorized",
			status: 401
		});
	}
	if (session.user.emailVerified) {
		throw createError({
			status: 422,
			message: "Email already verified"
		});
	}
	// ...
});
```
