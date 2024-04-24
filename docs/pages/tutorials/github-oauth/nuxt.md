---
title: "GitHub OAuth in Nuxt"
---

# Tutorial: GitHub OAuth in Nuxt

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/nuxt) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/nuxt/github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nuxt/github-oauth).

```
npx degit https://github.com/lucia-auth/examples/tree/main/nuxt/github-oauth <directory_name>
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:3000/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

```bash
# .env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Update database

Add a `github_id` and `username` column to your user table.

| column      | type     | attributes |
| ----------- | -------- | ---------- |
| `github_id` | `number` | unique     |
| `username`  | `string` |            |

Create a `DatabaseUserAttributes` interface in the module declaration and add your database columns. By default, Lucia will not expose any database columns to the `User` type. To add a `githubId` and `username` field to it, use the `getUserAttributes()` option.

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
			githubId: attributes.github_id,
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
	github_id: number;
	username: string;
}
```

## Setup Arctic

We recommend using [Arctic](https://arctic.js.org) for implementing OAuth. It is a lightweight library that provides APIs for creating authorization URLs, validating callbacks, and refreshing access tokens. This is the easiest way to implement OAuth with Lucia and it supports most major providers.

```
npm install arctic
```

Initialize the GitHub provider with the client ID and secret.

```ts
import { GitHub } from "arctic";

export const github = new GitHub(process.env.GITHUB_CLIENT_ID!, process.env.GITHUB_CLIENT_SECRET!);
```

## Sign in page

Create `pages/login/index.vue` and add a basic sign in button, which should be a link to `/login/github`.

```vue
<!-- pages/login/index.vue -->
<template>
	<h1>Sign in</h1>
	<a href="/login/github">Sign in with GitHub</a>
</template>
```

## Create authorization URL

Create an API route in `server/routes/login/github/index.get.ts`. Generate a new state, create a new authorization URL with createAuthorizationURL(), store the state, and redirect the user to the authorization URL. The user will be prompted to sign in with GitHub.

```ts
// server/routes/login/github/index.get.ts
import { generateState } from "arctic";

export default defineEventHandler(async (event) => {
	const state = generateState();
	const url = await github.createAuthorizationURL(state);

	setCookie(event, "github_oauth_state", state, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});
	return sendRedirect(event, url.toString());
});
```

## Validate callback

Create an API route in `server/routes/login/github/callback.get.ts` to handle the callback. First, get the state from the cookie and the search params and compare them. Validate the authorization code in the search params with `validateAuthorizationCode()`. This will throw an [`OAuth2RequestError`](https://oslo.js.org/reference/oauth2/OAuth2RequestError) if the code or credentials are invalid. After validating the code, get the user's profile using the access token. Check if the user is already registered with the GitHub ID, and create a new user if they aren't. Finally, create a new session and set the session cookie.

```ts
// server/routes/login/github/callback.get.ts
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const code = query.code?.toString() ?? null;
	const state = query.state?.toString() ?? null;
	const storedState = getCookie(event, "github_oauth_state") ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		throw createError({
			status: 400
		});
	}

	try {
		const tokens = await github.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const githubUser: GitHubUser = await githubUserResponse.json();

		// Replace this with your own DB client.
		const existingUser = await db.table("user").where("github_id", "=", githubUser.id).get();

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
			return sendRedirect(event, "/");
		}

		const userId = generateIdFromEntropySize(10); // 16 characters long

		// Replace this with your own DB client.
		await db.table("user").insert({
			id: userId,
			github_id: githubUser.id,
			username: githubUser.login
		});

		const session = await lucia.createSession(userId, {});
		appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
		return sendRedirect(event, "/");
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			throw createError({
				status: 400
			});
		}
		throw createError({
			status: 500
		});
	}
});

interface GitHubUser {
	id: string;
	login: string;
}
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
	const data = await useRequestFetch()("/api/user");
	if (data) {
		user.value = data;
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
	await $fetch("/api/logout", {
		method: "POST"
	});
	await navigateTo("/login");
}
</script>

<template>
	<form @submit.prevent="logout">
		<button>Sign out</button>
	</form>
</template>
```
