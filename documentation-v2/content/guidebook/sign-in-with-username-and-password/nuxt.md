---
title: "Sign in with email and password in Nuxt"
menuTitle: "Nuxt"
description: "Learn the basic of Lucia by implementing a basic username and password authentication in Nuxt"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/nuxt)._

This guide will cover how to implement a simple username and password authentication using Lucia in Nuxt. It will have 3 parts:

- A sign up page
- A sign in page
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the Nuxt example from the repository.

```
npx degit pilcrowonpaper/lucia/examples/nuxt/username-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/nuxt/username-and-password).

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type that's unique.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// server/app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// server/utils/lucia.ts
import { lucia } from "lucia";
import { h3 } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production
	middleware: h3(),

	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;
```

## Sign up page

Create `pages/signup.vue`. It will have a form with inputs for username and password

```vue
<!-- pages/signup.vue -->
<script lang="ts" setup>
const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	await $fetch("/api/signup", {
		method: "POST",
		body: {
			username: formData.get("username"),
			password: formData.get("password")
		},
		redirect: "manual" // ignore redirect responses
	});
	await navigateTo("/"); // profile page
};
</script>

<template>
	<h1>Sign up</h1>
	<form method="post" action="/api/signup" @submit.prevent="handleSubmit">
		<label for="username">Username</label>
		<input name="username" id="username" /><br />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" /><br />
		<input type="submit" />
	</form>
	<NuxtLink to="/login">Sign in</NuxtLink>
</template>
```

### Create users

Create `server/api/signup.post.ts`.

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). [`AuthRequest`](/reference/lucia/interfaces/authrequest) can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with `H3Event`.

```ts
// server/api/signup.post.ts
export default defineEventHandler(async (event) => {
	const { username, password } = await readBody<{
		username: unknown;
		password: unknown;
	}>(event);
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 4 ||
		username.length > 31
	) {
		throw createError({
			message: "Invalid username",
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
				providerId: "username", // auth method
				providerUserId: username, // unique id when using "username" auth method
				password // hashed by Lucia
			},
			attributes: {
				username
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return sendRedirect(event, "/"); // redirect to profile page
	} catch (e) {
		// this part depends on the database you're using
		// check for unique constraint error in user table
		if (
			e instanceof SomeDatabaseError &&
			e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
		) {
			throw createError({
				message: "Username already taken",
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

#### Error handling

Lucia throws 2 types of errors: [`LuciaError`](/reference/lucia/main#luciaerror) and database errors from the database driver or ORM you're using. Most database related errors, such as connection failure, duplicate values, and foreign key constraint errors, are thrown as is. These need to be handled as if you were using just the driver/ORM.

```ts
if (
	e instanceof SomeDatabaseError &&
	e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
) {
	// username already taken
}
```

## Sign in page

Create `pages/login.vue`. This will have a form with inputs for username and password

```vue
<!-- pages/login.vue -->
<script lang="ts" setup>
const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	await $fetch("/api/login", {
		method: "POST",
		body: {
			username: formData.get("username"),
			password: formData.get("password")
		},
		redirect: "manual" // ignore redirect responses
	});
	await navigateTo("/"); // profile page
};
</script>

<template>
	<h1>Sign in</h1>
	<form
		method="post"
		action="/api/login"
		@submit.prevent="handleSubmit"
		enctype="multipart/form-data"
	>
		<label for="username">Username</label>
		<input name="username" id="username" /><br />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" /><br />
		<input type="submit" />
	</form>
	<NuxtLink to="/signup">Create an account</NuxtLink>
</template>
```

### Authenticate users

Create `server/api/login.post.ts`.

The key we created for the user allows us to get the user via their username, and validate their password. This can be done with [`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey). If the username and password is correct, we'll create a new session just like we did before. If not, Lucia will throw an error.

```ts
// server/api/login.post.ts
import { LuciaError } from "lucia";

export default defineEventHandler(async (event) => {
	const { username, password } = await readBody<{
		username: unknown;
		password: unknown;
	}>(event);
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 1 ||
		username.length > 31
	) {
		throw createError({
			message: "Invalid username",
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
		const user = await auth.useKey("username", username, password);
		const session = await auth.createSession({
			userId: user.userId,
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
			throw createError({
				message: "Incorrect username or password",
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

Create `useUser()` and `useAuthenticatedUser()` composables. `useUser()` will return the user state. `useAuthenticatedUser()` can only be used inside protected routes, which allows the ref value type to be always defined (never `null`).

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
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async () => {
	const user = await useUser();
	if (!user.value) return navigateTo("/login");
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

## Redirect authenticated user

For both `pages/signup.vue` and `pages/login.vue`, redirect authenticated users to the profile page.

```vue
<!-- pages/signup.vue -->
<!-- pages/login.vue -->
<script lang="ts" setup>
const user = useUser();
if (user.value) {
	await navigateTo("/"); // redirect to profile page
}

const handleSubmit = async (e: Event) => {
	// ...
};
</script>
```

## Profile page

Create `pages/index.vue`. This will show some basic user info and include a logout button.

Use the `protected` middleware to redirect unauthenticated users, and call `useAuthenticatedUser()` to get the authenticated user.

```vue
<!-- pages/index.vue -->
<script lang="ts" setup>
definePageMeta({
	middleware: ["protected"]
});

const user = await useAuthenticatedUser();

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	await $fetch("/api/login", {
		method: "POST",
		body: formData,
		redirect: "manual" // ignore redirect responses
	});
	await navigateTo("/login");
};
</script>

<template>
	<h1>Profile</h1>
	<p>User id: {{ user.userId }}</p>
	<p>Username: {{ user.username }}</p>
	<form method="post" action="/api/logout" @submit.prevent="handleSubmit">
		<input type="submit" value="Sign out" />
	</form>
</template>
```

### Sign out users

Create `server/api/logout.post.ts`.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
// server/api/logout.post.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		throw createError({
			message: "Not authenticated",
			statusCode: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	authRequest.setSession(null);
	return sendRedirect(event, "/login");
});
```
