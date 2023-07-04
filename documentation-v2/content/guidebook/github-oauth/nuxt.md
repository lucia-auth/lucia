---
title: "Github OAuth in Nuxt"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth in Nuxt"
menuTitle: "Nuxt"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/nuxt)._

This guide will cover how to implement Github OAuth using Lucia in Nuxt. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the Nuxt example from the repository.

```
npx degit pilcrowonpaper/lucia/examples/nuxt/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/nuxt/github-oauth).

## Create an OAuth app

[Create a Github OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect uri to:

```
http://localhost:3000/api/login/github/callback
```

Copy and paste the client id and client secret into your `.env` file:

```bash
# .env
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

Expose the environment variables by updating your Nuxt config.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	// ...
	runtimeConfig: {
		githubClientId: "", // keep it empty!
		githubClientSecret: "" // keep it empty!
	}
});
```

## Update your database

Add a `github_username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type (optionally unique).

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// server/app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type DatabaseUserAttributes = {
		github_username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's Github username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// server/utils/lucia.ts
import { lucia } from "lucia";
import { h3 } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production
	middleware: h3(),

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
// server/utils/lucia.ts
import { lucia } from "lucia";
import { h3 } from "lucia/middleware";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

const runtimeConfig = useRuntimeConfig();

export const githubAuth = github(auth, {
	clientId: runtimeConfig.githubClientId,
	clientSecret: runtimeConfig.githubClientSecret
});

export type Auth = typeof auth;
```

## Sign in page

Create `pages/login.vue`. It will have a "Sign in with Github" button (actually a link).

```vue
<!-- pages/login.vue -->
<template>
	<h1>Sign in</h1>
	<a href="/api/login/github">Sign in with Github</a>
</template>
```

When a user clicks the link, the destination (`/api/login/github`) will redirect the user to Github to be authenticated.

## Authenticate with Github

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and Github redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Generate authorization url

Create `server/api/login/github/index.get.ts`. [`GithubProvider.getAuthorizationUrl()`](/oauth/providers/github#getauthorizationurl) will create a new Github authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
// server/api/login/github/index.get.ts
export default defineEventHandler(async (event) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	setCookie(event, "github_oauth_state", state, {
		httpOnly: true,
		secure: !process.dev,
		path: "/",
		maxAge: 60 * 60
	});
	return sendRedirect(event, url.toString());
});
```

### Validate callback

Create `server/api/login/github/callback.get.ts`

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). [`AuthRequest`](/reference/lucia/interfaces/authrequest) can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with `H3Event`.

```ts
// server/api/login/github/callback.get.ts
import { OAuthRequestError } from "@lucia-auth/oauth";

export default defineEventHandler(async (event) => {
	const storedState = getCookie(event, "github_oauth_state");
	const query = getQuery(event);
	const state = query.state?.toString();
	const code = query.code?.toString();
	// validate state
	if (!storedState || !state || storedState !== state || !code) {
		return sendError(
			event,
			createError({
				statusCode: 400
			})
		);
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
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return sendRedirect(event, "/"); // redirect to profile page
	} catch (e) {
		if (e instanceof OAuthRequestError) {
			// invalid code
			return sendError(
				event,
				createError({
					statusCode: 400
				})
			);
		}
		return sendError(
			event,
			createError({
				statusCode: 500
			})
		);
	}
});
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

## Managing auth state

### Get authenticated user

Create `server/api/user.get.ts`. This endpoint will return the current user. You can validate requests by creating by calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```ts
// server/api/user.get.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	return {
		user: session?.user ?? null;
	}
});
```

### Composables

Create `useUser()` and `useAuthenticatedUser()` composables. `useUser()` will return the user state. `useAuthenticatedUser()` can only be used inside protected routes, which allows the ref value type to be always defined (never `null`).

```ts
// composables/auth.ts
import type { User } from "lucia";

export const useUser = () => {
	const user = useState<User | null>("user", () => null);
	return user;
};

export const useAuthenticatedUser = () => {
	const user = useUser();
	return computed(() => {
		const userValue = unref(user);
		if (!userValue) {
			throw createError(
				"useAuthenticatedUser() can only be used in protected pages"
			);
		}
		return userValue;
	});
};
```

### Define middleware

Define a global `auth` middleware that gets the current user and populates the user state. This will run on every navigation.

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async () => {
	const user = await useUser();
	if (!user.value) return navigateTo("/login");
});
```

Next, define a regular `protected` middleware that redirects unauthenticated users to the login page.

```ts
// middleware/protected.ts
export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();
	if (!user.value) return navigateTo("/login");
});
```

## Redirect authenticated user

Redirect authenticated users to the profile page in `pages/login.vue`.

```vue
<!-- pages/login.vue -->
<script lang="ts" setup>
const user = useUser();
if (user.value) {
	await navigateTo("/"); // redirect to profile page
}

const handleSubmit = async (e: Event) => {
	// ...
};
</script>
```

## Profile page

Create `pages/index.vue`. This will show some basic user info and include a logout button.

Use the `protected` middleware to redirect unauthenticated users, and call `useAuthenticatedUser()` to get the authenticated user.

```vue
<!-- pages/index.vue -->
<script lang="ts" setup>
definePageMeta({
	middleware: ["protected"]
});

const user = await useAuthenticatedUser();

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	await $fetch("/api/login", {
		method: "POST",
		body: formData,
		redirect: "manual" // ignore redirect responses
	});
	await navigateTo("/login");
};
</script>

<template>
	<h1>Profile</h1>
	<p>User id: {{ user.userId }}</p>
	<p>Github username: {{ user.githubUsername }}</p>
	<form method="post" action="/api/logout" @submit.prevent="handleSubmit">
		<input type="submit" value="Sign out" />
	</form>
</template>
```

### Sign out users

Create `server/api/logout.post.ts`.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
// server/api/logout.post.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		throw createError({
			message: "Not authenticated",
			statusCode: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	authRequest.setSession(null);
	return sendRedirect(event, "/login");
});
```
