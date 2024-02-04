---
title: "Tutorial: Username and password auth in Nuxt"
---

# Tutorial: Username and password auth in Nuxt

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/nuxt) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/nuxt/username-and-password) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/v3/nuxt/username-and-password).

```
npx degit https://github.com/lucia-auth/examples/tree/main/nuxt/username-and-password <directory_name>
```

## Update database

Add a `username` and `hashed_password` column to your user table.

| column            | type     | attributes |
| ----------------- | -------- | ---------- |
| `username`        | `string` | unique     |
| `hashed_password` | `string` |            |

Create a `DatabaseUserAttributes` interface in the module declaration and add your database columns. By default, Lucia will not expose any database columns to the `User` type. To add a `username` field to it, use the `getUserAttributes()` option.

```ts
// server/utils/auth.ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !import.meta.dev
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

Create `pages/signup.nuxt` and set up a basic form.

```vue
<!--pages/signup.vue-->
<script lang="ts" setup>
async function signup(e: Event) {
	const result = await useFetch("/api/signup", {
		method: "POST",
		body: new FormData(e.target as HTMLFormElement)
	});
	if (!result.error.value) {
		await navigateTo("/");
	}
}
</script>

<template>
	<h1>Create an account</h1>
	<form method="post" action="/api/login" @submit.prevent="signup">
		<label htmlFor="username">Username</label>
		<input name="username" id="username" />
		<br />
		<label htmlFor="password">Password</label>
		<input type="password" name="password" id="password" />
		<br />
		<button>Continue</button>
	</form>
</template>
```

Create an API route in `server/api/signup.post.ts`. First, do a very basic input validation. Hash the password, generate a new user ID, and create a new user. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```ts
// server/api/signup.post.ts
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { SqliteError } from "better-sqlite3";

export default eventHandler(async (event) => {
	const formData = await readFormData(event);
	const username = formData.get("username");
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		throw createError({
			message: "Invalid username",
			statusCode: 400
		});
	}
	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		throw createError({
			message: "Invalid password",
			statusCode: 400
		});
	}

	const hashedPassword = await new Argon2id().hash(password);
	const userId = generateId(15);

	// TODO: check if username is already used
	await db.table("user").insert({
		id: userId,
		username: username,
		hashed_password: hashedPassword
	});

	const session = await lucia.createSession(userId, {});
	appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
});
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

Create `pages/login.vue` and set up a basic form.

```vue
<!--pages/login.vue-->
<script lang="ts" setup>
async function login(e: Event) {
	const result = await useFetch("/api/login", {
		method: "POST",
		body: new FormData(e.target as HTMLFormElement)
	});
	if (!result.error.value) {
		await navigateTo("/");
	}
}
</script>

<template>
	<h1>Sign in</h1>
	<form method="post" action="/api/login" @submit.prevent="login">
		<label htmlFor="username">Username</label>
		<input name="username" id="username" />
		<br />
		<label htmlFor="password">Password</label>
		<input type="password" name="password" id="password" />
		<br />
		<button>Continue</button>
	</form>
</template>
```

Create an API route as `server/api/login.post.ts`. First, do a very basic input validation. Get the user with the username and verify the password. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```ts
// server/api/login.post.ts
import { Argon2id } from "oslo/password";

export default eventHandler(async (event) => {
	const formData = await readFormData(event);
	const username = formData.get("username");
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		throw createError({
			message: "Invalid username",
			statusCode: 400
		});
	}
	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		throw createError({
			message: "Invalid password",
			statusCode: 400
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
		throw createError({
			message: "Incorrect username or password",
			statusCode: 400
		});
	}

	const validPassword = await new Argon2id().verify(existingUser.password, password);
	if (!validPassword) {
		throw createError({
			message: "Incorrect username or password",
			statusCode: 400
		});
	}

	const session = await lucia.createSession(existingUser.id, {});
	appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
});
```

## Validate requests

You can validate requests by checking `event.context.user`. The field `user.username` is available since we defined the `getUserAttributes()` option. You can protect pages, such as `/`, by redirecting unauthenticated users to the login page.

```ts
export default defineEventHandler((event) => {
	if (event.context.user) {
		const username = event.context.user.username;
	}
	// ...
});
```

## Get user in the client

Create an API route in `server/api/user.get.ts`. This will just return the current user.

```ts
// server/api/user.get.ts
export default defineEventHandler((event) => {
	return event.context.user;
});
```

Create a composable `useUser()` in `composables/auth.ts`.

```ts
// composables/auth.ts
import type { User } from "lucia";

export const useUser = () => {
	const user = useState<User | null>("user", () => null);
	return user;
};
```

Then, create a global middleware in `middleware/auth.global.ts` to populate it.

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();
	const { data } = await useFetch("/api/user");
	if (data.value) {
		user.value = data.value;
	}
});
```

You can now use `useUser()` client side to get the current user.

```vue
<script lang="ts" setup>
const user = useUser();
</script>
```

## Sign out

Sign out users by invalidating their session with `Lucia.invalidateSession()`. Make sure to remove their session cookie by setting a blank session cookie created with `Lucia.createBlankSessionCookie()`.

```ts
// server/api/logout.post.ts
export default eventHandler(async (event) => {
	if (!event.context.session) {
		throw createError({
			statusCode: 403
		});
	}
	await lucia.invalidateSession(event.context.session.id);
	appendHeader(event, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
});
```

```vue
<script lang="ts" setup>
async function logout() {
	await useFetch("/api/logout", {
		method: "POST"
	});
	navigateTo("/login");
}
</script>

<template>
	<form @submit.prevent="logout">
		<button>Sign out</button>
	</form>
</template>
```
