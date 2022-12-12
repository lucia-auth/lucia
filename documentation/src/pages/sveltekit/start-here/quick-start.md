---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Quick start"
---

This page will guide you on how to implement a simple username/password auth using SvelteKit and cover the basics of Lucia.

The [SvelteKit example project](https://github.com/pilcrowOnPaper/lucia-auth/tree/main/examples/sveltekit) in the repo expands on this guide.

Start off by following the steps in [Getting Started](/sveltekit/start-here/getting-started) to set up Lucia and your database.

## 1. Configure your database

Add a `username` column in the `user` table.

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
	import { enhance } from '$app/forms';
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

We'll set the provider id as `username` and the username as the identifier. This tells Lucia that the user was created using the username/password auth method and that the unique identifier is the username. We'll also set the password and store the username. After creating a new user, create a new session and store the session id as a cookie.

For the session to update in the client, we need to call [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) or refresh the page entirely so we can re-run our [load function](https://kit.svelte.dev/docs/load). Load functions will only re-run when `invalidateAll()` is called or during navigation. `use:enhance` will only call `invalidateAll()` when the server returns a success response (a redirect response is not considered as a success response). Since we're just using the default behavior of `use:enhance`, the action will not return a redirect, and the load function will handle redirect after sign up.

```ts
// routes/signup/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import type { PageServerLoad, Actions } from './$types';

// If the user exists, redirect authenticated users to the profile page.
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get('username');
		const password = form.get('password');

		// check for empty values
		if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
			return fail(400);
		}

		try {
			const user = await auth.createUser('username', username, {
				password,
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

## 4. Sign in page

Create `routes/login/` route dir. This route will handle sign-ins. Create 2 files inside it: `+page.svelte` and `+page.server.ts`.

### Sign in form

This form will also have an input field for username and password.

```svelte
<!-- routes/login/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
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

We'll use `username` as the provider id and the username as the identifier. This tells Lucia to find a user that was created using the username/password auth method where the unique identifier is the username. Create a new session if the password is valid, and store the session id.

```ts
// routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import type { PageServerLoad, Actions } from './$types';

// If the user exists, redirect authenticated users to the profile page.
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();	
	if (session) throw redirect(302, '/');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get('username');
		const password = form.get('password');
		// check for empty values
		if (!username || !password || typeof username !== 'string' || typeof password !== 'string')
			return fail(400);
		try {
			const user = await auth.authenticateUser('username', username, password);
			const session = await auth.createSession(user.userId);
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
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/login');
};

```

### Sign out

Add a button that calls [`signOut()`](/sveltekit/api-reference/client-api#signout) and [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall). `invalidateAll()` will cause all of the load functions to re-run, which will update the session in the client so that the user gets redirected to the login page.

```svelte
<script lang="ts">
	import { signOut, getUser } from "@lucia-auth/sveltekit/client";
	import { invalidateAll } from "$app/navigation";

	const user = getUser();
</script>

<h1>Profile</h1>
<div>
	<p>User id: {user?.userId}</p>
	<p>Username: {user?.username}</p>
</div>

<button
	on:click={async () => {
		await signOut();
		invalidateAll();
	}}>Sign out</button
>
```

## 6. Request validation

The methods inside `locals` can be used inside actions (`+page.server.ts`), server load functions, and `+server.ts` files as well.

```ts
// +page.server.ts
import type { Actions, PageServerLoad } from "./$types";

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.getSession();
		if (!session) {
			// unauthenticated
		}
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		// unauthenticated
	}
};
```

```ts
// +server.ts
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		// unauthenticated
	}
};
```
