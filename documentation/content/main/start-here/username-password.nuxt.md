---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia in Nuxt by implementing a basic username/password auth"
---

This page will guide you how to implement a simple username/password auth and cover the basics of Lucia.

Start off by following the steps in the [previous page](/start-here/getting-started) to set up Lucia and your database.

### Clone example project

You can also clone the [Nuxt example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/nuxt), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/nuxt <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/nuxt).

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | :----: | -------------------- |
| username | string |   ✓    | username of the user |

## 2. Configure Lucia

In `server/lucia.d.ts`, add `username` in `UserAttributes` since we added `username` column to `user` table:

```ts
// server/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./utils/auth.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

Add [`transformDatabaseUser()`](/basics/configuration#transformuserdata) to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// server/utils/auth.js
export const auth = lucia({
	adapter: prisma(),
	env: "DEV" // "PROD" if prod,
	middleware: h3(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});
```

## 3. Sign up page

### Sign up form

Create `pages/signup.vue`. This form will have an input field for username and password.

```vue
<!-- pages/signup.vue -->

<script lang="ts" setup>
const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/signup", {
			method: "POST",
			body: Object.fromEntries(formData.entries())
		});
		navigateTo("/");
	} catch (error) {
		console.log(error);
	}
};
</script>

<template>
	<h2>Create an account</h2>
	<form @submit.prevent="handleSubmit">
		<label htmlFor="username">username</label>
		<br />
		<input id="username" name="username" />
		<br />
		<label htmlFor="password">password</label>
		<br />
		<input type="password" id="password" name="password" />
		<br />
		<input type="submit" value="Continue" class="button" />
	</form>
	<NuxtLink to="/login" class="link"> Sign in </NuxtLink>
</template>
```

### Create users

Create `server/api/signup.post.ts`. This API route will handle account creation.

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `H3Event`.

Users can be created with `createUser()`. This will create a new primary key that can be used to authenticate user as well. We’ll use `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user). Create a new session with [`createSession()`](/reference/lucia-auth/auth#createsession) and make sure to store the session id by calling [`setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
// server/api/signup.post.ts
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

export default defineEventHandler(async (event) => {
	const { username, password } = (await readBody(event)) ?? {};
	if (!username || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid input"
		});
	}
	try {
		const user = await auth.createUser({
			primaryKey: {
				providerId: "username",
				providerUserId: username,
				password
			},
			attributes: {
				username
			}
		});
		const session = await auth.createSession(user.userId);
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return null;
	} catch (error) {
		throw createError({
			statusCode: 400,
			statusMessage: "Username unavailable"
		});
	}
});
```

#### Handle requests

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `H3Event`.

In this case, we don't need to validate the request, but we do need it for setting the session cookie with [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
const authRequest = auth.handleRequest({ req, res });
```

> (warn) Nuxt does not check for [cross site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) on API requests. While `AuthRequest.validateUser()` will do a CSRF check and only return a user/session if it passes the check, **make sure to add CSRF protection** to routes that doesn't rely on Lucia for validation. You can check if the request is coming from the same domain as where the app is hosted by using the `Origin` header.

#### Set user passwords

We don't store the password in the user, but in the key (`primaryKey`). Keys represent the relationship between a user and a auth method, in this case username/password. We'll set `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user).

```ts
const user = await auth.createUser({
	primaryKey: {
		providerId: "username",
		providerUserId: username,
		password
	}
	// ...
});
```

> (warn) In an actual production code, you want to make sure you check for password strength. See the checklist in the [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls).

## 4. Sign in page

### Sign in form

Create `pages/login.vue`. This route will handle sign ins. This form will also have an input field for username and password.

```vue
<!-- pages/login.vue -->

<script lang="ts" setup>
const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/login", {
			method: "POST",
			body: Object.fromEntries(formData.entries())
		});
		navigateTo("/");
	} catch (error) {
		console.log(error);
	}
};
</script>

<template>
	<form @submit.prevent="handleSubmit">
		<label htmlFor="username">username</label>
		<br />
		<input id="username" name="username" />
		<br />
		<label htmlFor="password">password</label>
		<br />
		<input type="password" id="password" name="password" />
		<br />
		<input type="submit" value="Continue" class="button" />
	</form>
	<NuxtLink to="/login" class="link"> Sign in </NuxtLink>
</template>
```

### Authenticate users

Create `server/api/login.post.ts`. This API route will handle sign-ins.

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

```ts
// server/api/login.post.ts
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

export default defineEventHandler(async (event) => {
	const { username, password } = (await readBody(event)) ?? {};
	if (!username || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid input"
		});
	}
	try {
		const user = await auth.createUser({
			primaryKey: {
				providerId: "username",
				providerUserId: username,
				password
			},
			attributes: {
				username
			}
		});
		const session = await auth.createSession(user.userId);
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return null;
	} catch (error) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid username/password"
		});
	}
});
```

#### Validating passwords

We want to reference the key we created for the user in the previous step, so "username" will be the provider id and the username will be the provider user id. `useKey()` will throw an error if the key doesn't exist or if the password is incorrect.

```ts
const key = await auth.useKey("username", username, password);
```

## 5. Get current user

[`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validateuser) can be used inside a server context to validate the request and get the current user and session.

```ts
const { session, user } = await authRequest.validateUser();
```

Create a `server/api/user.get.ts`, which will return the current user.

```ts
// server/api/user.get.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const { user } = await authRequest.validateUser();
	return { user };
});
```

### Redirect authenticated users

In both the signup and login page, fetch the current user with `useFetch()`, and if a user exists, redirect them to `/` (profile page).

```vue
<!-- pages/signup.vue -->
<!-- pages/login.vue -->

<script lang="ts" setup>
const { data } = await useFetch("/api/user");
if (!data.value) throw createError("Failed to fetch data");
const user = data.value.user;
if (user) {
	await navigateTo("/");
}
// ...
</script>

<template>
	<!-- ... -->
</template>
```

## 6. Profile page (protected)

Create `pages/index.vue`. This page will show the user's data. Redirect the user to `/login` if they are unauthenticated.

```vue
<!-- pages/index.vue -->

<script lang="ts" setup>
const { data } = await useFetch("/api/user");
if (!data.value) throw createError("Failed to fetch data");
const user = data.value.user;
if (!user) await navigateTo("/login");

const handleSubmit = async () => {
	try {
		await $fetch("/api/logout", {
			method: "POST"
		});
		navigateTo("/login");
	} catch (error) {
		console.log(error);
	}
};
</script>

<template>
	<p>This page is protected and can only be accessed by authenticated users.</p>
	<pre class="code">{{ JSON.stringify(user, null, 2) }}</pre>

	<form @submit.prevent="handleSubmit">
		<input type="submit" class="button" value="Sign out" />
	</form>
</template>
```

### Sign out

Create `server/api/logout.post.ts`. This API route will handle sign-outs by invalidating the current session and removing the session cookie.

```ts
// server/api/logout.post.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const { session } = await authRequest.validateUser();
	if (!session) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized"
		});
	}
	await auth.invalidateSession(session.sessionId); // invalidate current session
	authRequest.setSession(null); // remove session cookie
	return null;
});
```
