---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia in SvelteKit by implementing a basic username/password auth"
---

This page will guide you on how to implement a simple username/password auth using SvelteKit and cover the basics of Lucia.

Start off by following the steps in [Getting Started](/start-here/getting-started?sveltekit) to set up Lucia and your database.

### Clone example project

You can also clone the [SvelteKit example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/sveltekit), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/sveltekit <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/sveltekit).

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | :----: | -------------------- |
| username | string |   ✓    | username of the user |

## 2. Configure Lucia

In `src/app.d.ts`, add `username` in `UserAttributes` since we added a `username` column to the `user` table:

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/lucia").Auth;
		type UserAttributes = {
			username: string;
		};
	}
}
```

Add `transformDatabaseUser()` to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// lib/server/lucia.ts
export const auth = lucia({
	adapter: prisma(client),
	env: "DEV" // "PROD" if prod,
	middleware: sveltekit(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});
```

## 3. Sign up page

Create `routes/signup/` route dir. This route will handle account creation. Create 2 files inside it: `+page.svelte` and `+page.server.ts`.

### Sign up form

This form will have an input field for username and password.

```svelte
<!-- routes/signup/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<div>
	<h1>Create an account</h1>
	<form method="POST" use:enhance>
		<label for="username">Username</label><br />
		<input id="username" name="username" /><br />
		<label for="password">Password</label><br />
		<input type="password" id="password" name="password" /><br />
		<input type="submit" value="Signup" />
	</form>
</div>
```

### Create users

Users and keys can be created with [`createUser()`](/reference/lucia-auth/auth#createuser). Create a new session with [`createSession()`](/reference/lucia-auth/auth?sveltekit#createsession) and make sure to store the session id by calling [`locals.auth.setSession()`](/reference/lucia-auth/authrequest#setsession). Remember that we set `locals.auth` in the hooks!

```ts
// routes/signup/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import type { PageServerLoad, Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get("username");
		const password = form.get("password");

		// check for empty values
		if (typeof username !== "string" || typeof password !== "string") {
			return fail(400);
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
			locals.auth.setSession(session);
		} catch {
			// username taken
			return fail(400);
		}
	}
};
```

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

### Redirect authenticated users

Let's also redirect authenticated users to the profile page. [`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validate) can be used to validate the request and get the current session and user.

```ts
// routes/signup/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.auth.validateUser();
	if (session) throw redirect(302, "/");
	return {};
};
```

**`local.auth.validateUser()` will only make a single database call regardless of how many times you call the method!**

## 4. Sign in page

Create `routes/login/` route dir. This route will handle sign-ins. Create 2 files inside it: `+page.svelte` and `+page.server.ts`.

### Sign in form

This form will also have an input field for username and password.

```svelte
<!-- routes/login/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<div>
	<h1>Sign in</h1>
	<form method="POST" use:enhance>
		<label for="username">Username</label><br />
		<input id="username" name="username" /><br />
		<label for="password">Password</label><br />
		<input type="password" id="password" name="password" /><br />
		<input type="submit" value="Continue" />
	</form>
</div>
```

### Authenticate users

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

```ts
// routes/login/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import type { PageServerLoad, Actions } from "./$types";

// If the user exists, redirect authenticated users to the profile page.
export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.auth.validateUser();
	if (session) throw redirect(302, "/");
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get("username");
		const password = form.get("password");
		// check for empty values
		if (typeof username !== "string" || typeof password !== "string")
			return fail(400);
		try {
			const key = await auth.useKey("username", username, password);
			const session = await auth.createSession(key.userId);
			locals.auth.setSession(session);
		} catch {
			// invalid username/password
			return fail(400);
		}
	}
};
```

#### Validating passwords

We want to reference the key we created for the user in the previous step, so "username" will be the provider id and the username will be the provider user id. `useKey()` will throw an error if the key doesn't exist or if the password is incorrect.

```ts
const key = await auth.useKey("username", username, password);
```

## 5. Profile page (protected)

This page will be the root (`/`). This route will show the user's data and have the note-taking portion of the app. Create 2 files inside of `src/routes`: `+page.svelte` and `+page.server.ts`. We'll make this route only accessible to authenticated users.

### Get current user

Since the current session and user is only exposed in the server, we have to explicitly pass it on to the client with a server load function.

Let's also redirect unauthenticated users to the login page.

```ts
// routes/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/login");
	return {
		user
	};
};
```

Now we can access the user from page data. Notice that the `username` property exists because it was included in the returned value of `transformPageData()`.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<h1>Profile</h1>
<div>
	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.username}</p>
</div>
<form use:enhance method="post">
	<input type="submit" value="Sign out" />
</form>
```

### Sign out users

To sign out an user, create a new action. This may be an API endpoint as well. Invalidate the current session and delete the cookie by passing `null` to `setSession()`.

```ts
// routes/+page.server.ts
import { type Actions, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { auth } from "$lib/server/lucia";

export const actions: Actions = {
	default: async ({ locals }) => {
		const { session } = await locals.auth.validateUser();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
	}
};
```

## 6. Validate requests

The methods inside `locals` can be used inside actions (`+page.server.ts`), server load functions, and `+server.ts` files as well.

```ts
// +page.server.ts
import type { Actions, PageServerLoad } from "./$types";

export const actions: Actions = {
	default: async ({ locals }) => {
		const { session, user } = await locals.auth.validateUser();
		if (!session) {
			// unauthenticated
		}
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.auth.validateUser();
	if (!session) {
		// unauthenticated
	}
};
```

```ts
// +server.ts
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	const { session, user } = await locals.auth.validateUser();
	if (!session) {
		// unauthenticated
	}
};
```
