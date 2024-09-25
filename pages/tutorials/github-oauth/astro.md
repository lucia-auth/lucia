---
title: "Tutorial: GitHub OAuth in Astro"
---

# Tutorial: GitHub OAuth in Astro

_Before starting, make sure you've created the session and cookie API outlined in the [Sessions](/sessions/overview) page._

An [example project](https://github.com/lucia-auth/example-astro-github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/example-astro-github-oauth).

```
git clone git@github.com:lucia-auth/example-astro-github-oauth.git
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:4321/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

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

export const github = new GitHub(import.meta.env.GITHUB_CLIENT_ID, import.meta.env.GITHUB_CLIENT_SECRET, null);
```

## Sign in page

Create `pages/login/index.astro` and add a basic sign in button, which should be a link to `/login/github`.

```html
<!-- pages/login/index.astro -->
<html lang="en">
	<body>
		<h1>Sign in</h1>
		<a href="/login/github">Sign in with GitHub</a>
	</body>
</html>
```

## Create authorization URL

Create an API route in `pages/login/github/index.ts`. Generate a new state and create a new authorization URL. Store the state and redirect the user to the authorization URL. The user will be redirected to GitHub's sign in page.

```ts
// pages/login/github/index.ts
import { generateState } from "arctic";
import { github } from "@lib/oauth";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const state = generateState();
	const url = await github.createAuthorizationURL(state, []);

	context.cookies.set("github_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: "lax"
	});

	return context.redirect(url.toString());
}
```

## Validate callback

Create an API route in `pages/login/github/callback.ts` to handle the callback. Check that the state in the URL matches the one that's stored. Then, validate the authorization code and stored code verifier. Use the access token to get the user's profile with the GitHub API. Check if the user is already registered; if not, create a new user. Finally, create a new session and set the session cookie to complete the authentication process.

```ts
// pages/login/github/callback.ts
import { generateSessionToken, createSession, setSessionTokenCookie } from "@lib/auth";
import { github } from "@lib/oauth";
import { OAuth2RequestError } from "arctic";

import type { APIContext } from "astro";
import type { OAuth2Tokens } from "arctic";

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("github_oauth_state")?.value ?? null;
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

	if (existingUser !== null) {
		const token = generateSessionToken();
		const session = await createSession(token, existingUser.id);
		setSessionTokenCookie(context, token, session.expiresAt);
		return context.redirect("/");
	}

	// TODO: Replace this with your own DB query.
	const user = await createUser(githubUserId, githubUsername);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(context, token, session.expiresAt);
	return context.redirect("/");
}
```

## Get the current user

If you implemented the middleware outlined in the [Session cookies in Astro](/sessions/cookies/astro) page, you can get the current session and user from `Locals`.

```ts
if (Astro.locals.user === null) {
	return Astro.redirect("/login");
}

const username = Astro.locals.user.username;
```

## Sign out

Sign out users by invalidating their session. Make sure to remove the session cookie as well.

```ts
import { invalidateSession, deleteSessionTokenCookie } from "@lib/auth";

import type { APIContext } from "astro";

export async function POST(context: APIContext): Promise<Response> {
	if (context.locals.session === null) {
		return new Response(null, {
			status: 401
		});
	}
	await invalidateSession(context.locals.session.id);
	deleteSessionTokenCookie(context);
	return context.redirect("/login");
}
```
