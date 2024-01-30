---
title: "Tutorial: Username and password auth in SvelteKit"
---

# Tutorial: Username and password auth in SvelteKit

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/astro) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/sveltekit/username-and-password) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/sveltekit/username-and-password).

```
npx degit https://github.com/lucia-auth/examples/tree/main/sveltekit/username-and-password <directory_name>
```

## Update database

Add a `username` and `hashed_password` column to your user table.

| column            | type     | attributes |
| ----------------- | -------- | ---------- |
| `username`        | `string` | unique     |
| `hashed_password` | `string` |            |

Create a `DatabaseUserAttributes` interface in the module declaration and add your database columns. By default, Lucia will not expose any database columns to the `User` type. To add a `username` field to it, use the `getUserAttributes()` option.

```ts
// src/lib/server/auth.ts
import { Lucia } from "lucia";
import { dev } from "$app/environment";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
}
```

## Sign up user

Create `routes/signup/+page.svelte` and set up a basic form.

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
    <button>Continue</button>
</form>
```

Create a form action in `routes/signup/+page.server.ts`. First, do a very basic input validation. Hash the password, generate a new user ID, and create a new user. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```ts
// routes/signup/+page.server.ts
import { lucia } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";

import type { Actions } from "./$types";

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get("username");
		const password = formData.get("password");
		// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
		// keep in mind some database (e.g. mysql) are case insensitive
		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message: "Invalid username"
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: "Invalid password"
			});
		}

		const userId = generateId(15);
		const hashedPassword = await new Argon2id().hash(password);

		// TODO: check if username is already used
		await db.table("user").insert({
			id: userId,
			username: username,
			hashed_password: hashedPassword
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});

		redirect(302, "/");
	}
};
```

We recommend using Argon2id, but Oslo also provides Scrypt and Bcrypt. These only work in Node.js. If you're planning to deploy your project to a non-Node.js runtime, use `Scrypt` provided by `lucia`. This is a pure JS implementation but 2~3 times slower. For Bun, use [`Bun.password`](https://bun.sh/docs/api/hashing#bun-password).

```ts
import { Scrypt } from "lucia";

new Scrypt().hash(password);
```

**If you're using Bcrypt, [set the maximum password length to 64 _bytes_](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#input-limits-of-bcrypt).**

```ts
const length = new TextEncoder().encode(password).length;
```

## Sign in user

Create `routes/login/+page.svelte` and set up a basic form.

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
	<button>Continue</button>
</form>
```

Create an API route as `pages/api/signup.ts`. First, do a very basic input validation. Get the user with the username and verify the password. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```ts
import { lucia } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";
import { Argon2id } from "oslo/password";

import type { Actions } from "./$types";

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get("username");
		const password = formData.get("password");

		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message: "Invalid username"
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: "Invalid password"
			});
		}

		const existingUser = await db
			.table("username")
			.where("username", "=", username.toLowerCase())
			.get();
		if (!existingUser) {
			// NOTE:
			// Returning immediately allows malicious actors to figure out valid usernames from response times,
			// allowing them to only focus on guessing passwords in brute-force attacks.
			// As a preventive measure, you may want to hash passwords even for invalid usernames.
			// However, valid usernames can be already be revealed with the signup page among other methods.
			// It will also be much more resource intensive.
			// Since protecting against this is none-trivial,
			// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
			// If usernames are public, you may outright tell the user that the username is invalid.
			return fail(400, {
				message: "Incorrect username or password"
			});
		}

		const validPassword = await new Argon2id().verify(existingUser.hashed_password, password);
		if (!validPassword) {
			return fail(400, {
				message: "Incorrect username or password"
			});
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});

		redirect(302, "/");
	}
};
```

## Validate requests

You can validate requests by checking `locals.user`. The field `user.username` is available since we defined the `getUserAttributes()` option. You can protect pages, such as `/`, by redirecting unauthenticated users to the login page.

```ts
// +page.server.ts
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) redirect(302, "/login");
	return {
		username: event.locals.user.username
	};
};
```

## Sign out user

Sign out users by invalidating their session with `Lucia.invalidateSession()`. Make sure to remove their session cookie by setting a blank session cookie created with `Lucia.createBlankSessionCookie()`.

```ts
// routes/+page.server.ts
import { lucia } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// ...
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
		redirect(302, "/login");
	}
};
```

```svelte
<!-- routes/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<form method="post" use:enhance>
    <button>Sign out</button>
</form>
```
