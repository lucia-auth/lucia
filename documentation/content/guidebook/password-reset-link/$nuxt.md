---
title: "Password reset links in Nuxt"
description: "Learn how to implement password reset using reset links"
---

This guide expects access to the user's verified email. See [Sign in with email and password with verification links](/guidebook/email-verification-links/nuxt) guide to learn how to verify the user's email, and email and password authentication in general.

```ts
// server/utils/lucia.ts
export const auth = lucia({
	adapter: ADAPTER,
	env: process.dev ? "DEV" : "PROD",
	middleware: h3(),

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

The [email and password Nuxt example](https://github.com/lucia-auth/examples/tree/main/nuxt/email-and-password) includes password reset.

```
npx degit lucia-auth/examples/nuxt/email-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nuxt/email-and-password).

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
// server/utils/token.ts
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
// server/utils/token.ts
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

Create `pages/password-reset/index.vue` and add a form with an input for the email.

```vue
<!-- vue/password-reset/index.vue -->
<script lang="ts" setup>
const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	await $fetch("/api/password-reset", {
		method: "POST",
		body: {
			email: formData.get("email")
		},
		redirect: "manual"
	});
};
</script>

<template>
	<h1>Reset password</h1>
	<form
		method="post"
		action="/api/password-reset"
		@submit.prevent="handleSubmit"
	>
		<label for="email">Email</label>
		<input name="email" id="email" /><br />
		<input type="submit" />
	</form>
</template>
```

Create `server/api/password-reset/index.post.ts`.

Lucia allows us to use raw database queries when needed, for example checking the validity of an email. If the email is valid, create a new password reset link and send it to the user's inbox.

```ts
// server/api/password-reset/index.post.ts`
export default defineEventHandler(async (event) => {
	const { email } = await readBody<{
		email: unknown;
	}>(event);
	// basic check
	if (!isValidEmail(email)) {
		throw createError({ status: 400, message: "Invalid email" });
	}
	try {
		const storedUser = await db
			.table("user")
			.where("email", "=", email.toLowerCase())
			.get();
		if (!storedUser) {
			throw createError({ status: 400, message: "User does not exist" });
		}
		const user = auth.transformDatabaseUser(storedUser);
		const token = await generatePasswordResetToken(user.userId);
		await sendPasswordResetLink(token);
		return {};
	} catch (e) {
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
```

## Reset password

Create `pages/password-reset/[token].vue` and add a form with an input for the new password.

```vue
<!-- pages/password-reset/[token].vue -->
<script lang="ts" setup>
const route = useRoute();
const apiRoute = `/api/password-reset/${route.params.token}`;

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	await $fetch(apiRoute, {
		method: "POST",
		body: {
			password: formData.get("password")
		},
		redirect: "manual"
	});
	await navigateTo("/");
};
</script>

<template>
	<h1>Reset password</h1>
	<form method="post" :action="apiRoute" @submit.prevent="handleSubmit">
		<label htmlFor="password">New Password</label>
		<input name="password" id="password" />
		<br />
		<input type="submit" />
	</form>
</template>
```

Create `server/api/password-reset/[token].post.ts`.

Get the token from the url with `event.context.params.token` and validate it with `validatePasswordResetToken()`. Update the key password with [`Auth.updateKeyPassword()`](/reference/lucia/interfaces/auth#updatekeypassword), and optionally verify the user's email. **Make sure you invalidate all user sessions with [`Auth.invalidateAllUserSessions()`](/reference/lucia/interfaces/auth#invalidateallusersessions) before updating the password.**

```ts
// server/api/password-reset/[token].ts
export default defineEventHandler(async (event) => {
	const { password } = await readBody<{
		password: unknown;
	}>(event);
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		throw createError({ status: 400, message: "Invalid password" });
	}
	try {
		const { token } = event.context.params ?? {
			token: ""
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
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return {};
	} catch (e) {
		throw createError({
			message: "Invalid or expired password reset link",
			statusCode: 400
		});
	}
});
```
