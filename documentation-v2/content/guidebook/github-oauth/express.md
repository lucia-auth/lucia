---
title: "Github OAuth in Express"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth in Express"
menuTitle: "Express"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/express)._

This guide will cover how to implement Github OAuth using Lucia in Express. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the Express example from the repository.

```
npx degit pilcrowonpaper/lucia/examples/express/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/express/github-oauth).

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

We'll expose the user's Github username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// lucia.ts
import { lucia } from "lucia";
import { express } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: express(),

	getUserAttributes: (data) => {
		return {
			githubUsername: data.github_username
		};
	}
});

export type Auth = typeof auth;
```

## Configure Express

Since we'll be using `application/x-www-form-urlencoded`, use the body parser middleware.

```ts
import express from "express";

const app = express();

app.use(express.urlencoded());
```

## Initialize the OAuth integration

Install the OAuth integration and `dotenv`.

```
npm i @lucia-auth/oauth dotenv
pnpm add @lucia-auth/oauth dotenv
yarn add @lucia-auth/oauth dotenv
```

Import the Github OAuth integration, and initialize it using your credentials.

```ts
// lucia.ts
import { lucia } from "lucia";
import { express } from "lucia/middleware";

import { github } from "@lucia-auth/oauth/providers";
import dotenv from "dotenv";

dotenv.config();

export const auth = lucia({
	// ...
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
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

```ts
import express from "express";
import { auth, githubAuth } from "./lucia.js";

app.get("/login/github", async (req, res) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	res.cookie("github_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60
	});
	return res.status(302).setHeader("Location", url.toString()).end();
});
```

### Validate callback

Create route `/login/github/callback` and handle GET requests.

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). [`AuthRequest`](/reference/lucia/interfaces/authrequest) can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with Express' `Request` and `Response`.

You can use [`parseCookie()`](/reference/lucia/utils#parsecookie) provided by Lucia to read the state cookie.

```ts
import express from "express";
import { auth, githubAuth } from "./lucia.js";
import { parseCookie } from "lucia/utils";
import { OAuthRequestError } from "@lucia-auth/oauth";

app.get("/login/github/callback", async (req, res) => {
	const cookies = parseCookie(req.headers.cookie ?? "");
	const storedState = cookies.github_oauth_state;
	const state = req.query.state;
	const code = req.query.code;
	// validate state
	if (
		!storedState ||
		!state ||
		storedState !== state ||
		typeof code !== "string"
	) {
		return res.sendStatus(400);
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
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end();
	} catch (e) {
		if (e instanceof OAuthRequestError) {
			// invalid code
			return res.sendStatus(400);
		}
		return res.sendStatus(500);
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

Authenticated users should be redirected to the profile page whenever they try to access the login page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest), which is stored as `Astro.locals.auth`, and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```ts
import { auth } from "./lucia.js";

app.get("/login", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	}
	return renderPage("signup.html"); // example
});
```

## Profile page

Create route `/`. `index.html` will show some basic user info and include a logout button.

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

Unauthenticated users should be redirected to the sign in page. The user object is available in `Session.user`, and you'll see that `User.githubUsername` exists because we defined it in first step with `getUserAttributes()` configuration.

```ts
import { auth } from "./lucia.js";

app.get("/", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (!session) {
		// redirect to login page
		return res.status(302).setHeader("Location", "/login").end();
	}
	return renderPage("index.html", {
		// display dynamic data
		user_id: session.user.userId, // replace '%%user_id%%'
		github_username: session.user.githubUsername // replace '%%github_username%%'
	});
});
```

### Sign out users

Create route `/logout` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
import { auth } from "./lucia.js";

app.post("/logout", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (!session) {
		return res.sendStatus(401);
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	// redirect back to login page
	return res.status(302).setHeader("Location", "/login").end();
});
```
