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

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type that's unique.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// server/env.d.ts

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

We want to expose the user's username to the `User` object returned by Lucia's APIs. We'll define [`getUserAttributes`](/basics/configuration#getuserattributes) and return the username.

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
		body: formData
	});
};
</script>

<template>
	<h1>Sign up</h1>
	<form method="post" action="/api/signup" @submit.prevent="handleSubmit">
		<label for="username">Username</label>
		<input name="username" id="username" />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" />
		<input type="submit" />
	</form>
</template>
```

### Create users

Create `server/api/signup.post.ts`.

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](). [`AuthRequest`]() can be created by calling [`Auth.handleRequest()`]() with `H3Event`.

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
		body: formData
	});
};
</script>

<template>
	<h1>Sign in</h1>
	<form method="post" action="/api/login" @submit.prevent="handleSubmit">
		<label for="username">Username</label>
		<input name="username" id="username" />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" />
		<input type="submit" />
	</form>
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

## Get authenticated user

Create `server/api/user.get.ts`. This endpoint will return the current user. You can validate requests by creating by calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```ts
// server/api/user.get.ts

export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = auth.validate();
	return session?.user ?? null;
});
```

For both `pages/signup.vue` and `pages/login.vue`, redirect authenticated users to the profile page.

```vue
<!-- pages/signup.vue -->
<!-- pages/login.vue -->
<script lang="ts" setup>
const { data, error } = await useFetch("/api/user");
if (error) throw createError("Failed to fetch data");
const user = data.value;
if (user) {
	await navigateTo("/"); // redirect to profile page
}

const handleSubmit = async (e: Event) => {
	// ...
};
</script>
```

## Profile page

Create `pages/index.vue`. This will show some basic user info and include a logout button.

```vue
<!-- pages/index.vue -->
<script lang="ts" setup>
const { data, error } = await useFetch("/api/user");
if (error) throw createError("Failed to fetch data");
const user = data.value;
if (!user) {
	await navigateTo("/login");
}

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	await $fetch("/api/logout", {
		method: "POST"
	});
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

### Get authenticated user

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.username` exists because we defined it in first step with `getUserAttributes()` configuration.

```ts
import { auth } from "./lucia.js";

export default defineEventHandler(async (event) => {
	const authRequest = await auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		// not authenticated
		return new Response(null, {
			headers: {
				Location: "/login" // redirect to login page
			},
			status: 302
		});
	}
	return renderPage({
		// display dynamic data
		user_id: session.user.userId,
		username: session.user.username
	});
});
```

### Sign out users

Create `server/api/logout.post.ts`.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
// server/api/logout.post.ts
export default defineEventHandler(async (event) => {
	const authRequest = await auth.handleRequest(request);
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
	// create blank session cookie
	const sessionCookie = auth.createSessionCookie(null);
	return sendRedirect(event, "/login");
});
```
