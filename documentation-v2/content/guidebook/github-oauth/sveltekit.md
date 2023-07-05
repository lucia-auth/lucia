---
title: "Github OAuth in SvelteKit"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth in SvelteKit"
menuTitle: "SvelteKit"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/sveltekit) and that you've implement the recommended `handle()` hook._

This guide will cover how to implement Github OAuth using Lucia in SvelteKit. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the SvelteKit example from the repository.

```
npx degit pilcrowonpaper/lucia/examples/sveltekit/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/sveltekit/github-oauth).

## Create an OAuth app

[Create a Github OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect uri to:

```
http://localhost:5173/login/github/callback
```

Copy and paste the client id and client secret into your `.env` file:

```bash
# .env
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

## Update your database

Add a `github_username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type (optionally unique).

Make sure you update `Lucia.DatabaseUserAttributes` in `app.d.ts` whenever you add any new columns to the user table.

```ts
// src/app.d.ts
/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/server/lucia").Auth;
		type DatabaseUserAttributes = {
			github_username: string;
		};
		type DatabaseSessionAttributes = {};
	}
}

// THIS IS IMPORTANT!!!
export {};
```

## Configure Lucia

We'll expose the user's Github username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: ADAPTER,
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),

	getUserAttributes: (data) => {
		return {
			githubUsername: data.github_username
		};
	}
});

export type Auth = typeof auth;
```

## Initialize the OAuth integration

Install the OAuth integration.

```
npm i @lucia-auth/oauth
pnpm add @lucia-auth/oauth
yarn add @lucia-auth/oauth
```

Import the Github OAuth integration, and initialize it using your credentials.

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

import { github } from "@lucia-auth/oauth/providers";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

export const auth = lucia({
	// ...
});

export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
```

If you're getting TypeScript errors, try generating your project types (and restart your IDE if needed).

```
npx svelte-kit sync
pnpm svelte-kit sync
```

## Sign in page

Create `routes/login/+page.svelte`. It will have a "Sign in with Github" button (actually a link).

```svelte
<!-- routes/login/+page.svelte -->
<h1>Sign in</h1>
<a href="/login/github">Sign in with Github</a>
```

When a user clicks the link, the destination (`/login/github`) will redirect the user to Github to be authenticated.

## Authenticate with Github

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and Github redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Generate authorization url

Create `routes/login/github/+server.ts` and handle GET requests. [`GithubProvider.getAuthorizationUrl()`](/oauth/providers/github#getauthorizationurl) will create a new Github authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
// routes/login/github/+server.ts
import { dev } from "$app/environment";
import { githubAuth } from "$lib/server/lucia.js";

export const GET = async ({ cookies }) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	// store state
	cookies.set("github_oauth_state", state, {
		httpOnly: true,
		secure: !dev,
		path: "/",
		maxAge: 60 * 60
	});
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
};
```

### Validate callback

Create `routes/login/github/callback/+server.ts` and handle GET requests.

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). Since we've setup a handle hook, `AuthRequest` is accessible as `locals.auth`.

```ts
// routes/login/github/callback/+server.ts
import { auth, githubAuth } from "$lib/server/lucia.js";
import { OAuthRequestError } from "@lucia-auth/oauth";

export const GET = async ({ url, cookies, locals }) => {
	const storedState = cookies.get("github_oauth_state");
	const state = url.searchParams.get("state");
	const code = url.searchParams.get("code");
	// validate state
	if (!storedState || !state || storedState !== state || !code) {
		return new Response(null, {
			status: 400
		});
	}
	try {
		const { existingUser, githubUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			if (existingUser) return existingUser;
			const user = await createUser({
				attributes: {
					github_username: githubUser.login
				}
			});
			return user;
		};

		const user = await getUser();
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		locals.auth.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		if (e instanceof OAuthRequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
};
```

#### Authenticate user with Lucia

You can check if the user has already registered with your app by checking `GithubUserAuth.existingUser`. Internally, this is done by checking if a [key](/basics/keys) with the Github user id already exists.

If they're a new user, you can create a new Lucia user (and key) with [`GithubUserAuth.createUser()`](/reference/oauth/interfaces#createuser). The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `github_username` to previously. You can access the Github user data with `GithubUserAuth.githubUser`, as well as the access tokens with `GithubUserAuth.githubTokens`.

```ts
const { existingUser, githubUser, createUser } =
	await githubAuth.validateCallback(code);

const getUser = async () => {
	if (existingUser) return existingUser;
	const user = await createUser({
		attributes: {
			github_username: githubUser.login
		}
	});
	return user;
};

const user = await getUser();
```

## Redirect authenticated users

Define a server load function in `routes/signup/+page.server.ts`.

Authenticated users should be redirected to the profile page whenever they try to access the sign in page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest), which is stored in `locals.auth`, and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```ts
// routes/login/+page.server.ts
import { auth } from "$lib/server/lucia";
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, "/");
	return {};
};
```

## Profile page

Create `routes/+page.svelte`. This will show some basic user info and include a logout button. Expect TS error for now since we have populated `PageData` yet.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<h1>Profile</h1>
<p>User id: {data.userId}</p>
<p>Github username: {data.githubUsername}</p>
<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>
```

### Get authenticated user

Create `routes/+page.server.ts` and define a load function.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.githubUsername` exists because we defined it in first step with `getUserAttributes()` configuration.

```ts
// routes/+page.server.ts
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/login");
	return {
		userId: session.user.userId,
		githubUsername: session.user.githubUsername
	};
};
```

### Sign out users

Define a new server action in `routes/+page.server.ts`.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be done by passing `null` to `AuthRequest.setSession()`.

```ts
// routes/+page.server.ts
import { auth } from "$lib/server/lucia";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// ...
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		throw redirect(302, "/login"); // redirect to login page
	}
};
```
