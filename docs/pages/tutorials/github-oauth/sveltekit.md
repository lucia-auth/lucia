---
title: "GitHub OAuth in SvelteKit"
---

# Tutorial: GitHub OAuth in SvelteKit

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/sveltekit) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/sveltekit/github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/sveltekit/github-oauth).

```
npx degit https://github.com/lucia-auth/examples/tree/main/sveltekit/github-oauth <directory_name>
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:5173/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

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
// src/lib/server/auth.ts
// ...
import { GitHub } from "arctic";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
```

## Sign in page

Create `routes/login/+page.svelte` and add a basic sign in button, which should be a link to `/login/github`.

```svelte
<!-- routes/login/+page.svelte -->
<h1>Sign in</h1>
<a href="/login/github">Sign in with GitHub</a>
```

## Create authorization URL

Create an API route in `routes/login/github/+server.ts`. Generate a new state, create a new authorization URL with createAuthorizationURL(), store the state, and redirect the user to the authorization URL. The user will be prompted to sign in with GitHub.

```ts
// routes/login/github/+server.ts
import { redirect } from "@sveltejs/kit";
import { generateState } from "arctic";
import { github } from "$lib/server/auth";

import type { RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const url = await github.createAuthorizationURL(state);

	event.cookies.set("github_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	redirect(302, url.toString());
}
```

## Validate callback

Create an API route in `routes/login/github/callback/+server.ts` to handle the callback. First, get the state from the cookie and the search params and compare them. Validate the authorization code in the search params with `validateAuthorizationCode()`. This will throw an [`OAuth2RequestError`](https://oslo.js.org/reference/oauth2/OAuth2RequestError) if the code or credentials are invalid. After validating the code, get the user's profile using the access token. Check if the user is already registered with the GitHub ID, and create a new user if they aren't. Finally, create a new session and set the session cookie.

```ts
// routes/login/github/callback/+server.ts
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { github, lucia } from "$lib/server/auth";

import type { RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("github_oauth_state") ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
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
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		} else {
			const userId = generateIdFromEntropySize(10); // 16 characters long

			// Replace this with your own DB client.
			await db.table("user").insert({
				id: userId,
				github_id: githubUser.id,
				username: githubUser.login
			});

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GitHubUser {
	id: number;
	login: string;
}
```

## Validate requests

You can validate requests by checking `locals.user`. The field `user.username` is available since we defined the `getUserAttributes()` option. You can protect pages, such as `/`, by redirecting unauthenticated users to the login page.

```ts
// routes/+page.server.ts
import type { PageServerLoad } from "./$types";

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
import { fail, redirect } from "@sveltejs/kit";
import { lucia } from "$lib/server/auth";

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
