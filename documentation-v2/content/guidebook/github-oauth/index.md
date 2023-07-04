---
title: "Github OAuth"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth"
_order: "1"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started)._

This guide will cover how to implement Github OAuth using Lucia. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

## Create an OAuth app

[Create a Github OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect uri to (make sure to change the port number accordingly):

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

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// app.d.ts

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

Since we're dealing with the standard `Request` and `Response`, we'll use the [`web()`](/reference/lucia/middleware#web) middleware. We're also setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) to false since we can't update the session cookie when validating them.

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production

	middleware: web(),
	sessionCookie: {
		expires: false
	}
});

export type Auth = typeof auth;
```

We also want to expose the user's username to the `User` object returned by Lucia's APIs. We'll define [`getUserAttributes`](/basics/configuration#getuserattributes) and return the username.

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production
	middleware: web(),
	sessionCookie: {
		expires: false
	},

	getUserAttributes: (data) => {
		return {
			githubUsername: data.github_username
		};
	}
});

export type Auth = typeof auth;
```

## Initialize the OAuth integration

Install the OAuth integration and `dotenv`.

```
npm i @lucia-auth/oauth
pnpm add @lucia-auth/oauth
yarn add @lucia-auth/oauth
```

Import the Github OAuth integration, and initialize it using your credentials.

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID, // env var
	clientSecret: GITHUB_CLIENT_SECRET // env var
});

export type Auth = typeof auth;
```

## Sign in page

Create route `/login`. `login.html` will have a "Sign in with Github" button (actually a link).

```html
<!-- login.html -->
<html lang="en">
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<h1>Sign in</h1>
		<a href="/login/github">Sign in with Github</a>
	</body>
</html>
```

When a user clicks the link, the destination (`/login/github`) will redirect the user to Github to be authenticated.

## Authenticate with Github

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and Github redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Generate authorization url

Create route `/login/github` and handle GET requests.

Create a new Github authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

You can use [`serializeCookie()`](/reference/lucia/utils#serializecookie) provided by Lucia to get the `Set-Cookie` header.

```ts
import { serializeCookie } from "lucia/utils";
import { auth, githubAuth } from "./lucia.js";

get("/login/github", async () => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	const stateCookie = serializeCookie("github_oauth_state", state, {
		httpOnly: true,
		secure: false, // `true` for production
		path: "/",
		maxAge: 60 * 60
	});
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString(),
			"Set-Cookie": stateCookie
		}
	});
});
```

### Validate callback

Create route `/login/github/callback` and handle GET requests.

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession). This session should be stored as a cookie, which can be created with [`Auth.createSessionCookie()`](/reference/lucia/interfaces/auth#createsessioncookie).

You can use [`parseCookie()`](/reference/lucia/utils#parsecookie) provided by Lucia to read the state cookie.

```ts
import { auth, githubAuth } from "./lucia.js";
import { parseCookie } from "lucia/utils";
import { OAuthRequestError } from "@lucia-auth/oauth";

get("/login/github/callback", async (request: Request) => {
	const cookies = parseCookie(request.headers.get("Cookie") ?? "");
	const storedState = cookies.github_oauth_state;
	const url = new URL(request.url);
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
		const sessionCookie = auth.createSessionCookie(session);
		// redirect to profile page
		return new Response(null, {
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize() // store session cookie
			},
			status: 302
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

## Redirect authenticated users

Authenticated users should be redirected to the profile page whenever they try to access the sign in page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

Since we're using the `web()` middleware, `Auth.handleRequest()` expects the standard `Request`.

```ts
import { auth } from "./lucia.js";

get("/signup", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return new Response(null, {
			headers: {
				Location: "/"
			},
			status: 302
		});
	}
	return renderPage();
});
```

## Profile page

Create router `/`. `index.html` will show some basic user info and include a logout button.

```html
<!-- index.html -->
<html lang="en">
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<h1>Profile</h1>
		<!-- some template stuff -->
		<p>User id: %%user_id%%</p>
		<p>Github username: %%github_username%%</p>
		<form method="post" action="/logout">
			<input type="submit" value="Sign out" />
		</form>
	</body>
</html>
```

### Get authenticated user

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.githubUsername` exists because we defined it in first step with `getUserAttributes()` configuration.

```ts
import { auth } from "./lucia.js";

get("/", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		// redirect to login page
		return new Response(null, {
			headers: {
				Location: "/login"
			},
			status: 302
		});
	}
	return renderPage({
		// display dynamic data
		user_id: session.user.userId,
		github_username: session.user.githubUsername
	});
});
```

### Sign out users

Create route `/logout` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
import { auth } from "./lucia.js";

post("/logout", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return new Response("Not authenticated", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// create blank session cookie
	const sessionCookie = auth.createSessionCookie(null);
	return new Response(null, {
		headers: {
			Location: "/login", // redirect to login page
			"Set-Cookie": sessionCookie.serialize() // delete session cookie
		},
		status: 302
	});
});
```
