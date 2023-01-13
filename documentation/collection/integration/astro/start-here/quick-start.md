---
_order: 1
title: "Quick start"
---

This page will guide you how to implement a simple username/password authentication using Astro and cover the basics of Lucia.

The [Astro example project](https://github.com/pilcrowOnPaper/lucia-auth/tree/main/examples/astro) in the repo expands on this guide.

Start off by following the steps in [the previous page](/astro/start-here/getting-started) to set up Lucia and your database.

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but
you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | ------ | -------------------- |
| username | string | true   | Username of the user |

## 2. Configure Lucia

In `src/lucia.d.ts`, add `username` in `UserAttributes` since we added `username` column to `user` table:

```ts
// src/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

Add [`transformUserData()`](/reference/configure/lucia-configurations#transformuserdata) to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// lib/lucia.ts

// ...

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

### Sign up form

Create `pages/signup.astro`. This form will have an input field for username and password.

```astro
<h1>Create an account</h1>
<form method="post">
	<label for="username">username</label><br />
	<input id="username" name="username" /><br />
	<label for="password">password</label><br />
	<input type="password" id="password" name="password" /><br />
	<input type="submit" value="Continue" class="button" />
</form>
```

### Create users

In the same page, we'll also handle the POST request from the form.

`@lucia-auth/astro` provides [`AuthRequest`](/astro/api-reference/server-api#authrequest), which makes it easier to handle sessions and cookies within Astro. Initialize it with `auth` and the `Astro` context (an API route context can be used as well).

We'll set the provider id as `username` and the inputted username as the identifier. This tells Lucia that the user was created using the username/password auth method and that the unique identifier is the username. The `createUser` method also handles password hashing before storing the user. After creating a new user, create a new session and store the session cookie using [`AuthRequest.setSession()`](/astro/api-reference/server-api#setsession).

```astro
---
// pages/signup.astro
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";

const authRequest = new AuthRequest(auth, Astro);

if (Astro.request.method === "POST") {
	const form = await Astro.request.formData();
	const username = form.get("username");
	const password = form.get("password");
	// check for empty values
	if (username && password && typeof username === "string" && typeof password === "string") {
		try {
			const user = await auth.createUser("username", username, {
				password,
				attributes: {
					username
				}
			});
			const session = await auth.createSession(user.userId);
			authRequest.setSession(session); // set session cookie
			return Astro.redirect("/", 302); // redirect on successful attempt
		} catch {
			// username already in use
			Astro.response.status = 400;
		}
	} else {
		Astro.response.status = 400;
	}
}
---
```

### Redirect authenticated users

[`authRequest.validate()`](/astro/api-reference/server-api#validate) can be used inside a server context to validate the request and get the current session.

```astro
---
// pages/signup.astro
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";

const authRequest = new AuthRequest(auth, Astro);
const session = await authRequest.validate();
if (session) return Astro.redirect("/", 302); // redirect to profile page if authenticated

if (Astro.request.method === "POST") {
	// ...
}
---
```

## 4. Sign in page

### Sign in form

Create `pages/login.astro`. This route will handle sign ins using a form, which will also have an input field for username and password.

```astro
<h1>Sign in</h1>
<form method="post">
	<label for="username">username</label><br />
	<input id="username" name="username" /><br />
	<label for="password">password</label><br />
	<input type="password" id="password" name="password" /><br />
	<input type="submit" value="Continue" class="button" />
</form>
```

### Authenticate users

The same page will also handle form submissions.

We'll use `username` as the provider id and the username as the identifier. This tells Lucia to find a user that was created using username/password auth method where the unique identifier is the username. Create a new session if the password is valid, and store the session id.

```astro
---
// pages/signup.astro
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";

const authRequest = new AuthRequest(auth, Astro);

if (Astro.request.method === "POST") {
	const form = await Astro.request.formData();
	const username = form.get("username");
	const password = form.get("password");
	// check for empty values
	if (username && password && typeof username === "string" && typeof password === "string") {
		try {
			const user = await auth.authenticateUser("username", username, password);
			const session = await auth.createSession(user.userId);
			authRequest.setSession(session);
			return Astro.redirect("/", 302); // redirect on successful attempt
		} catch {
			// username already in use
			Astro.response.status = 400;
		}
	} else {
		Astro.response.status = 400;
	}
}
---
```

### Redirect authenticated users

If the session exists, redirect authenticated users to the profile page.

```astro
---
// pages/signup.astro
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";

const authRequest = new AuthRequest(auth, Astro);
const session = await authRequest.validate();
if (session) return Astro.redirect("/", 302); // redirect to profile page if authenticated

if (Astro.request.method === "POST") {
	// ...
}
---
```

## 5. Profile page (protected)

This page will be the root page (`pages/index.astro`). This route will show the user's data and have the note-taking portion of the app.

### Get current user

The current user and session can be retrieved using [`authRequest.validateUser()`](/astro/api-reference/server-api#validateuser). Redirect the user to the login page if unauthenticated.

```astro
---
// pages/index.astro
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";

const authRequest = new AuthRequest(auth, Astro);
const { user } = await authRequest.validateUser();

if (!user) return Astro.redirect("/login", 302);
---

<h1>Profile</h1>
<div>
	<p>User id: {$user?.userId}</p>
	<p>Username: {$user?.username}</p>
</div>
```

### Sign out

Add a button that calls [`signOut()`](/astro/api-reference/client-api#signout) (imported from `@lucia-auth/astro/client`) and redirect the user to `/login` afterward. The url for `signOut()` is the api route where you added `handleSignOut()`. (Make sure hydrate the component!)

```svelte
<script lang="ts">
	import { signOut } from "@lucia-auth/astro/client";

	const handleSignOut = async () => {
		await signOut("/api/logout");
		window.location.href = "/login";
	};
</script>

<button on:click={handleSignOut}>Sign out</button>
```

## 6. Request validation

`AuthRequest` can be used inside API routes as well:

```ts
// pages/api/random-number.ts
import { AuthRequest } from "@lucia-auth/astro";
import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const authRequest = new AuthRequest(auth, context);
	const session = await authRequest.validate();
	// ...
};
export const post: APIRoute = async (context) => {
	const authRequest = new AuthRequest(auth, context);
	// ...
};
```
