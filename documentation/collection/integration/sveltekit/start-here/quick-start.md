---
_order: 1
title: "Quick start"
---

This page will guide you on how to implement a simple username/password auth using SvelteKit and cover the basics of Lucia.

The [SvelteKit example project](https://github.com/pilcrowOnPaper/lucia-auth/tree/main/examples/sveltekit) in the repo expands on this guide.

Start off by following the steps in [Getting Started](/sveltekit/start-here/getting-started) to set up Lucia and your database.

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but
you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | ------ | -------------------- |
| username | string | true   | Username of the user |

## 2. Configure Lucia

In `src/app.d.ts`, add `username` in `UserAttributes` since we added a `username` column to the `user` table:

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

Add `transformUserData()` to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// lib/server/lucia.ts
export const auth = lucia({
	adapter: prisma(client),
	env: dev ? "DEV" : "PROD",
	transformUserData: (userData) => {
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

Users can be created with `createUser()`. This will create a new primary key that can be used to authenticate user as well. We'll use `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user). Create a new session and make sure to store the session id by calling `setSession()`.

```ts
// routes/signup/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import type { PageServerLoad, Actions } from "./$types";

// If the user exists, redirect authenticated users to the profile page.
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (session) throw redirect(302, "/");
	return {};
};

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
				key: {
					providerId: "username",
					providerUserId: username,
					password
				},
				attributes: {
					username
				}
			});
			const session = await auth.createSession(user.userId);
			locals.setSession(session);
		} catch {
			// username already in use
			return fail(400);
		}
	}
};
```

> For the session state to update in the client, we have to invalidate the root load function. `use:enhance` will only invalidate all load functions on a successful response and not on a redirect response.  So, we're not redirecting the user inside the action and let the load functions, triggered by the invalidation, handle redirecting unauthenticated users.
>
> Learn more in [Using forms](/sveltekit/basics/using-forms).

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

We'll use the key created in the previous section to reference the user and authenticate them by validating the password. As such, `"username"` will be the provider id and the username will be the provider user id. We can validate the password using `validateRequestKey()`.

```ts
// routes/login/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import type { PageServerLoad, Actions } from "./$types";

// If the user exists, redirect authenticated users to the profile page.
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
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
			const key = await auth.validateRequestKey("username", username, password);
			const session = await auth.createSession(key.userId);
			locals.setSession(session);
		} catch {
			// invalid credentials
			return fail(400);
		}
	}
};
```

## 5. Profile page (protected)

This page will be the root (`/`). This route will show the user's data and have the note-taking portion of the app. Create 2 files inside of `src/routes`: `+page.svelte` and `+page.server.ts`. We'll make this route only accessible to authenticated users.

### Get current user

You can get the current user using `getUser()`. Notice that the `username` property exists because it was included in the returned value of `transformPageData()`.

```svelte
<script lang="ts">
	import { getUser } from "@lucia-auth/sveltekit/client";

	const user = getUser();
</script>

<h1>Profile</h1>
<div>
	<p>User id: {$user?.userId}</p>
	<p>Username: {$user?.username}</p>
</div>
```

### Redirect unauthenticated user

```ts
// routes/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) throw redirect(302, "/login");
};
```

## 6. Validate requests

The methods inside `locals` can be used inside actions (`+page.server.ts`), server load functions, and `+server.ts` files as well.

```ts
// +page.server.ts
import type { Actions, PageServerLoad } from "./$types";

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.validate();
		if (!session) {
			// unauthenticated
		}
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) {
		// unauthenticated
	}
};
```

```ts
// +server.ts
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) {
		// unauthenticated
	}
};
```

## 7. Sign out users

To sign out an user, create a new action. This may be an API endpoint as well. Invalidate the current session and delete the cookie by passing `null` to `setSession()`.

```ts
import { type Actions, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { auth } from "$lib/server/lucia";

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.validate();
		if (!session) throw fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.setSession(null); // remove cookie
	}
};
```

Instead of a sign out button, add a form.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<form use:enhance method="post">
	<input type="submit" class="button" value="Sign out" />
</form>
```
