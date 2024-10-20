---
title: "Tutorial: GitHub OAuth in SvelteKit"
---

# Tutorial: GitHub OAuth in SvelteKit

_Before starting, make sure you've created the session and cookie API outlined in the [Sessions](/sessions/overview) page._

An [example project](https://github.com/lucia-auth/example-sveltekit-github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/example-sveltekit-github-oauth).

```
git clone git@github.com:lucia-auth/example-sveltekit-github-oauth.git
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:5173/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

```bash
# .env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Update database

Update your user model to include the user's GitHub ID and username.

```ts
interface User {
	id: number;
	githubId: number;
	username: string;
}
```

## Setup Arctic

We recommend using [Arctic](https://arcticjs.dev) for implementing OAuth. Arctic is a lightweight OAuth client library that supports 50+ providers out of the box.

```
npm install arctic
```

Initialize the GitHub provider with the client ID and secret.

```ts
import { GitHub } from "arctic";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, null);
```

## Sign in page

Create `routes/login/+page.svelte` and add a basic sign in button, which should be a link to `/login/github`.

```svelte
<!-- routes/login/+page.svelte -->
<h1>Sign in</h1>
<a href="/login/github">Sign in with GitHub</a>
```

## Create authorization URL

Create an API route in `routes/login/github/+server.ts`. Generate a new state and create a new authorization URL. Store the state and redirect the user to the authorization URL. The user will be redirected to GitHub's sign in page.

```ts
// routes/login/github/+server.ts
import { redirect } from "@sveltejs/kit";
import { generateState } from "arctic";
import { github } from "$lib/server/oauth";

import type { RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const url = github.createAuthorizationURL(state, []);

	event.cookies.set("github_oauth_state", state, {
		path: "/",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
```

## Validate callback

Create an API route in `routes/login/github/callback/+server.ts` to handle the callback. Check that the state in the URL matches the one that's stored. Then, validate the authorization code and stored code verifier. Use the access token to get the user's profile with the GitHub API. Check if the user is already registered; if not, create a new user. Finally, create a new session and set the session cookie to complete the authentication process.

```ts
// routes/login/github/callback/+server.ts
import { generateSessionToken, createSession, setSessionTokenCookie } from "$lib/server/session";
import { github } from "$lib/server/oauth";

import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("github_oauth_state") ?? null;
	if (code === null || state === null || storedState === null) {
		return new Response(null, {
			status: 400
		});
	}
	if (state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch (e) {
		// Invalid code or client credentials
		return new Response(null, {
			status: 400
		});
	}
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`
		}
	});
	const githubUser = await githubUserResponse.json();
	const githubUserId = githubUser.id;
	const githubUsername = githubUser.login;

	// TODO: Replace this with your own DB query.
	const existingUser = await getUserFromGitHubId(githubUserId);

	if (existingUser) {
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	}

	// TODO: Replace this with your own DB query.
	const user = await createUser(githubUserId, githubUsername);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/"
		}
	});
}
```

## Get the current user

If you implemented the middleware outlined in the [Session cookies in SvelteKit](/sessions/cookies/sveltekit) page, you can get the current session and user from `Locals`.

```ts
// routes/+page.server.ts
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, "/login");
	}

	return {
		user
	};
};
```

## Sign out

Sign out users by invalidating their session. Make sure to remove the session cookie as well.

```ts
// routes/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { invalidateSession, deleteSessionTokenCookie } from "$lib/server/session";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// ...
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session === null) {
			return fail(401);
		}
		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		return redirect(302, "/login");
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
