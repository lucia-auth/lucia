---
title: "Github OAuth in Astro"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth in Astro"
menuTitle: "Astro"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/astro) and that you've implement the recommended middleware._

This guide will cover how to implement Github OAuth using Lucia in Astro. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the Astro example from the repository.

```
npx degit pilcrowonpaper/lucia/examples/astro/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/astro/github-oauth).

## Create an OAuth app

[Create a Github OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect uri to:

```
http://localhost:3000/login/github/callback
```

Copy and paste the client id and client secret into your `.env` file:

```bash
# .env
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

## Update your database

Add a `github_username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type (optionally unique).

Make sure you update `Lucia.DatabaseUserAttributes` in `env.d.ts` whenever you add any new columns to the user table.

```ts
// src/env.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lib/lucia").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's Github username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// src/lib/lucia.ts
import { lucia } from "lucia";
import { astro } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: import.meta.env.DEV ? "DEV" : "PROD",
	middleware: astro(),

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
// src/lib/lucia.ts
import { lucia } from "lucia";
import { astro } from "lucia/middleware";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

export const githubAuth = github(auth, {
	clientId: import.meta.env.GITHUB_CLIENT_ID,
	clientSecret: import.meta.env.GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
```

## Sign in page

Create `pages/login/index.astro`. It will have a "Sign in with Github" button (actually a link).

```astro
---
// pages/login/index.astro
---

<h1>Sign in</h1>
<a href="/login/github">Sign in with Github</a>
```

When a user clicks the link, the destination (`/login/github`) will redirect the user to Github to be authenticated.

## Authenticate with Github

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and Github redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Generate authorization url

Create `pages/login/github/index.ts` and handle GET requests. [`GithubProvider.getAuthorizationUrl()`](/oauth/providers/github#getauthorizationurl) will create a new Github authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
// pages/login/github/index.ts
import { githubAuth } from "../../../lib/lucia";

import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	// store state
	context.cookies.set("github_oauth_state", state, {
		httpOnly: true,
		secure: !import.meta.env.DEV,
		path: "/",
		maxAge: 60 * 60
	});
	return context.redirect(url.toString(), 302);
};
```

### Validate callback

Create `pages/login/github/callback.ts` and handle GET requests.

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). Since we've setup middleware, `AuthRequest` is accessible as `context.locals.auth`.

```ts
// pages/login/github/callback.ts
import { auth, githubAuth } from "../../../lib/lucia.js";
import { OAuthRequestError } from "@lucia-auth/oauth";

import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const storedState = context.cookies.get("github_oauth_state").value;
	const state = context.url.searchParams.get("state");
	const code = context.url.searchParams.get("code");
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
		context.locals.auth.setSession(session);
		return context.redirect("/login", 302); // redirect to profile page
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

Authenticated users should be redirected to the profile page whenever they try to access the sign in page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest), which is stored as `Astro.locals.auth`, and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```astro
---
// src/pages/login.astro
import { auth } from "../lib/lucia";

const session = await Astro.locals.auth.validate();
if (session) return Astro.redirect("/", 302); // redirect to profile page
---

<h1>Sign in</h1>
<a href="/login/github">Sign in with Github</a>
```

## Profile page

Create `src/pages/index.astro`. This page will show some basic user info and include a logout button.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.githubUsername` exists because we defined it in first step with `getUserAttributes()` configuration.

```astro
---
// src/pages/index.astro
const session = await Astro.locals.auth.validate();
if (!session) return Astro.redirect("/login", 302);
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
	</head>
	<body>
		<h1>Profile</h1>
		<p>User id: {session.user.userId}</p>
		<p>Github username: {session.user.githubUsername}</p>
		<form method="post" action="/logout">
			<input type="submit" value="Sign out" />
		</form>
	</body>
</html>
```

### Sign out users

Create `src/pages/logout.ts` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be done by passing `null` to `AuthRequest.setSession()`.

```ts
// src/pages/logout.ts
import { auth } from "../lib/lucia";

import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
	const session = await context.locals.auth.validate();
	if (!session) {
		return new Response("Not authenticated", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	context.locals.auth.setSession(null);
	return context.redirect("/login", 302);
};
```
