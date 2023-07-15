---
title: "Sign in with username and password in SvelteKit"
menuTitle: "SvelteKit"
description: "Learn the basic of Lucia by implementing a basic username and password authentication in SvelteKit"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/sveltekit) and that you've implement the recommended `handle()` hook._

This guide will cover how to implement a simple username and password authentication using Lucia in SvelteKit. It will have 3 parts:

- A sign up page
- A sign in page
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the [SvelteKit example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/sveltekit/username-and-password) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/sveltekit/username-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/sveltekit/username-and-password).

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type that's unique.

Make sure you update `Lucia.DatabaseUserAttributes` in `app.d.ts` whenever you add any new columns to the user table.

```ts
// src/app.d.ts
/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/server/lucia").Auth;
		type DatabaseUserAttributes = {
			username: string;
		};
		type DatabaseSessionAttributes = {};
	}
}

// THIS IS IMPORTANT!!!
export {};
```

## Configure Lucia

We'll expose the user's username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: ADAPTER,
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),

	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;
```

## Sign up page

Create `routes/signup/+page.svelte`. It will have a form with inputs for username and password

```svelte
<!-- routes/signup/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<h1>Sign up</h1>
<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/login">Sign in</a>
```

### Create users

Create `routes/signup/+page.server.ts` and define a new form action to handle form submissions.

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). Since we've setup a handle hook, `AuthRequest` is accessible as `locals.auth`.

```ts
// routes/signup/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");
		// basic check
		if (
			typeof username !== "string" ||
			username.length < 4 ||
			username.length > 31
		) {
			return fail(400, {
				message: "Invalid username"
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
					providerId: "username", // auth method
					providerUserId: username.toLowerCase(), // unique id when using "username" auth method
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
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			// this part depends on the database you're using
			// check for unique constraint error in user table
			if (
				e instanceof SomeDatabaseError &&
				e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
			) {
				return fail(400, {
					message: "Username already taken"
				});
			}
			return fail(500, {
				message: "An unknown error occurred"
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, "/");
	}
};
```

#### Case sensitivity

Depending on your database, `user123` and `USER123` may be treated as different strings. To avoid 2 users having the same username with different cases, we are going to make the username lowercase before creating a key. This is crucial when setting a user-provided input as a provider user id of a key.

On the other hand, making the username stored as a user attribute lowercase is optional. However, if you need to query users using usernames (e.g. url `/user/user123`), it may be beneficial to require the username to be lowercase, store 2 usernames (lowercase and normal), or set the database to ignore casing when compare strings (e.g. using `LOWER()` in SQL).

```ts
const user = await auth.createUser({
	key: {
		providerId: "username", // auth method
		providerUserId: username.toLowerCase(), // unique id when using "username" auth method
		password // hashed by Lucia
	},
	attributes: {
		username
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

### Redirect authenticated users

Define a server load function in `routes/signup/+page.server.ts`.

Authenticated users should be redirected to the profile page whenever they try to access the sign up page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest), which is stored in `locals.auth`, and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```ts
// routes/signup/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, "/");
	return {};
};
```

## Sign in page

Create `routes/login/+page.svelte`. It will also have a form with inputs for username and password.

```svelte
<!-- routes/login/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<h1>Sign in</h1>
<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/signup">Create an account</a>
```

### Authenticate users

Create routes/signup/+page.server.ts and define a new form action to handle form submissions.

The key we created for the user allows us to get the user via their username, and validate their password. This can be done with [`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey). If the username and password is correct, we'll create a new session just like we did before. If not, Lucia will throw an error. Make sure to make the username lowercase before calling `useKey()`.

```ts
// routes/login/+page.server.ts
import { auth } from "$lib/server/lucia";
import { LuciaError } from "lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");
		// basic check
		if (
			typeof username !== "string" ||
			username.length < 1 ||
			username.length > 31
		) {
			return fail(400, {
				message: "Invalid username"
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
			const user = await auth.useKey(
				"username",
				username.toLowerCase(),
				password
			);
			const session = await auth.createSession({
				userId: user.userId,
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
					message: "Incorrect username of password"
				});
			}
			return fail(500, {
				message: "An unknown error occurred"
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, "/");
	}
};
```

### Redirect authenticated users

As we did in the sign up page, redirect authenticated users to the profile page by defining a server load function in `routes/login/+page.server.ts`.

```ts
// routes/login/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, "/");
	return {};
};

export const actions: Actions = {
	// ...
};
```

## Profile page

Create `routes/+page.svelte`. This will show some basic user info and include a logout button. Expect TS error for now since we have populated `PageData` yet.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<h1>Profile</h1>
<p>User id: {data.userId}</p>
<p>Username: {data.username}</p>
<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>
```

### Get authenticated user

Create `routes/+page.server.ts` and define a load function.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.username` exists because we defined it in first step with `getUserAttributes()` configuration.

```ts
// routes/+page.server.ts
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/login");
	return {
		userId: session.user.userId,
		username: session.user.username
	};
};
```

### Sign out users

Define a new server action in `routes/+page.server.ts`.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be done by passing `null` to `AuthRequest.setSession()`.

```ts
// routes/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// ...
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		throw redirect(302, "/login"); // redirect to login page
	}
};
```
