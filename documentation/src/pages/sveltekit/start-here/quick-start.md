---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Quick start"
---

This will guide you how to implement a simple username/password auth and cover the basics of Lucia. The app we're creating will be a simple note taking app with 3 pages: a sign up page, sign in page, and a profile page (this page will need auth).

The [username/password example project](https://github.com/pilcrowOnPaper/lucia-auth/tree/main/examples/sveltekit/username-password-supabase) in the repo expands on this guide.

Start off by following the steps in [the previous page](/sveltekit/start-here/getting-started) to set up Lucia and your database.

## 1. Configure your database

Since we're implementing a username based auth, add a `username` column in the `user` table. This should be a text column with a unique constraint.

## 2. Configure Lucia

In `src/app.d.ts`, add `username` in `UserAttributes` since we added `username` column to `user` table:

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

Add `transformUserData()` to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// lib/server/lucia.ts
export const auth = lucia({
	adapter: prisma(),
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

Create `routes/signup/` route dir. This route will handle account creation. Create 3 folders inside it: `+page.svelte`, `+page.server.ts`, and `+page.ts`.

### Sign up form

This form will have an input field for username and password.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<div>
	<h1>Create an account</h1>
	<form method="post" use:enhance>
		<label for="username">username</label><br />
		<input id="username" name="username" /><br />
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" /><br />
		<input type="submit" value="Continue" class="button" />
	</form>
</div>
```

### Create users

We'll set the provider id as `username` and the username as the identifier. This tells Lucia that user was created using username/password auth method and the unique identifier is the username. Let's also set the password and store the username. After creating a new user, create a new session and store the session id as a cookie.

For the session to update in the client, we need to call [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) or refresh the page entirely. `use:enhance` will only call `invalidateAll()` when the server returns a success response, and a redirect response is not considered as a success response. Since we're just using the default behavior of `use:enhance`, the action will not return a redirect, and the load function (explained below) will handle redirect after sign up.

```ts
// +page.server.ts
import { invalid, redirect, type Actions } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get("username");
		const password = form.get("password");
		// check for empty values
		if (!username || !password || typeof username !== "string" || typeof password !== "string")
			return invalid(400);
		try {
			const user = await auth.createUser("username", username, {
				password,
				attributes: {
					username
				}
			});
			const session = await auth.createSession(user.userId);
			locals.setSession(session);
		} catch {
			// username already in use
			return invalid(400);
		}
	}
};
```

### Redirect authenticated users

[`getUser()`](/sveltekit/api-reference/load-api#getuser) can be used to get the user inside shared load functions (server load functions should use [`locals.getSession()`](/sveltekit/api-reference/locals-api#getsession). This will await for the parent load functions in a server but run immediately on the client. If the user exists, redirect authenticated users to the profile page.

```ts
// +page.ts
import { redirect } from "@sveltejs/kit";
import { getUser } from "@lucia-auth/sveltekit/load";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const user = await getUser(event);
	if (user) throw redirect(302, "/");
	return {};
};
```

## 4. Sign in page

Create `routes/login/` route dir. This route will handle sign ins. Create 3 folders inside it: `+page.svelte`, `+page.server.ts`, and `+page.ts`.

### Sign in form

This form will also have an input field for username and password.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<div>
	<h1>Create an account</h1>
	<form method="post" use:enhance>
		<label for="username">username</label><br />
		<input id="username" name="username" /><br />
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" /><br />
		<input type="submit" value="Continue" class="button" />
	</form>
</div>
```

### Authenticate users

We'll use `username` as the provider id and the username as the identifier. This tells Lucia to find a user that was created using username/password auth method where the unique identifier is the username. Create a new session if the password is valid, and store the session id.

```ts
// +page.server.ts
import { invalid, redirect, type Actions } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get("username");
		const password = form.get("password");
		// check for empty values
		if (!username || !password || typeof username !== "string" || typeof password !== "string")
			return invalid(400);
		try {
			const user = await auth.authenticateUser("username", username, password);
			const session = await auth.createSession(user.userId);
			locals.setSession(session);
		} catch {
			// username already in use
			return invalid(400);
		}
	}
};
```

### Redirect authenticated users

If the user exists, redirect authenticated users to the profile page.

```ts
// +page.ts
import { redirect } from "@sveltejs/kit";
import { getUser } from "@lucia-auth/sveltekit/load";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const user = await getUser(event);
	if (user) throw redirect(302, "/");
	return {};
};
```

## 5. Profile page (protected)

This page will be the root (`/`). This route will show the user's data and have the note-taking portion of the app. Create 3 folders inside the root `/routes` dir: `+page.svelte`, `+page.server.ts`, and `+page.ts`. We'll make this route only accessible to authenticated users.

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
// +page.ts
import { redirect } from "@sveltejs/kit";
import { getUser } from "@lucia-auth/sveltekit/load";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const user = await getUser(event);
	if (!user) throw redirect(302, "/login");
};
```

### Sign out

Add a button that calls [`signOut()`](/sveltekit/api-reference/client-api#signout). Call [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) afterward to re-run load functions and update the session in the client so that the user gets redirected to the login page. `invalidateAll()` for updating the session after sign out will only work if it was preceded by `signOut()`.

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

Let's also add a note-taking functionality to the app. This "feature" should only be available to authenticated users. We're going to make this super simple and save the input as a cookie on the server.

### Input form

The input will have a default value of `$page.data.notes`. We'll cover this in a later step, but this will be the note saved to the cookie.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";
	import { signOut, getUser } from "@lucia-auth/sveltekit/client";
	import { page } from "$app/stores";

	const user = getUser();
</script>

<h1>Profile</h1>
<div>
	<p>User id: {user?.userId}</p>
	<p>Username: {user?.username}</p>
</div>

<div>
	<h2>Notes</h2>
	<form method="post" use:enhance>
		<input value={$page.data.notes} name="notes" />
		<input type="submit" value="Save" class="button" />
	</form>
</div>

<button on:click={() => signOut("/")}>Sign out</button>
```

### Validate requests and save notes

We can get the user's session using the `getSession()` method, which is provided by `locals`. The user is unauthenticated if `session` is `null`.

```ts
// +page.server.ts
import { dev } from "$app/environment";
import { auth } from "$lib/server/lucia";
import { invalid, redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
	default: async ({ cookies, request, locals }) => {
		const session = await locals.getSession();
		if (!session) return invalid(403);
		const formData = await request.formData();
		const notes = formData.get("notes")?.toString();
		if (notes === undefined) return invalid(400);
		cookies.set("notes", notes, {
			httpOnly: true,
			secure: !dev,
			path: "/"
		});
	}
};
```

### Read saved notes

This will read the "notes" cookies and send the value to the client.

```ts
// +page.server.ts
import { dev } from "$app/environment";
import { auth } from "$lib/server/lucia";
import { invalid, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const session = await locals.getSession();
	if (!session) throw redirect(302, "/login");
	const notes = cookies.get("notes") || "";
	return {
		notes
	};
};

export const actions: Actions = {
	// ...
};
```
