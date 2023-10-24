---
title: "GitHub OAuth in Express"
description: "Learn the basic of Lucia and the OAuth integration by implementing GitHub OAuth"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started/express)._

This guide will cover how to implement GitHub OAuth using Lucia in Express with session cookies. As a general overview of OAuth, the user is redirected to github.com to be authenticated, and GitHub redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Clone project

You can get started immediately by cloning the [Express example](https://github.com/lucia-auth/examples/tree/main/express/github-oauth) from the repository.

```
npx degit lucia-auth/examples/express/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/express/github-oauth).

## Create an OAuth app

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect uri, for example `http://localhost:3000/login/github/callback`.

Copy and paste the client id and client secret into your `.env` file:

```bash
# .env
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type (optionally unique).

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's GitHub username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

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
			githubUsername: data.username
		};
	}
});

export type Auth = typeof auth;
```

## Configure Express

Set up the body parser middleware.

```ts
import express from "express";

const app = express();

app.use(express.urlencoded()); // for application/x-www-form-urlencoded (forms)
app.use(express.json()); // for application/json
```

## Initialize the OAuth integration

Install the OAuth integration and `dotenv`.

```
npm i @lucia-auth/oauth dotenv
pnpm add @lucia-auth/oauth dotenv
yarn add @lucia-auth/oauth dotenv
```

Import the GitHub OAuth integration, and initialize it using your credentials.

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

## Generate authorization url

Create a new GitHub authorization url, where the user should be redirected to. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
import { auth, githubAuth } from "./lucia.js";

app.get("/login/github", async (req, res) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	res.cookie("github_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 1000 // 1 hour
	});
	return res.status(302).setHeader("Location", url.toString()).end();
});
```

For example, the user should be redirected to `/login/github` when they click "Sign in with GitHub."

```html
<a href="/login/github">Sign in with GitHub</a>
```

## Validate callback

Create your OAuth callback route that you defined when registering an OAuth app with GitHub, and handle GET requests.

When the user authenticates with GitHub, GitHub will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). [`AuthRequest`](/reference/lucia/interfaces/authrequest) can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with Express' `Request` and `Response`.

You can use [`parseCookie()`](/reference/lucia/modules/utils#parsecookie) provided by Lucia to read the state cookie.

```ts
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
		const { getExistingUser, githubUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			const existingUser = await getExistingUser();
			if (existingUser) return existingUser;
			const user = await createUser({
				attributes: {
					username: githubUser.login
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

### Authenticate user with Lucia

You can check if the user has already registered with your app by checking `GithubUserAuth.getExistingUser`. Internally, this is done by checking if a [key](/basics/keys) with the GitHub user id already exists.

If they're a new user, you can create a new Lucia user (and key) with [`GithubUserAuth.createUser()`](/reference/oauth/interfaces#createuser). The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously. You can access the GitHub user data with `GithubUserAuth.githubUser`, as well as the access tokens with `GithubUserAuth.githubTokens`.

```ts
const { getExistingUser, githubUser, createUser } =
	await githubAuth.validateCallback(code);

const getUser = async () => {
	const existingUser = await getExistingUser();
	if (existingUser) return existingUser;
	const user = await createUser({
		attributes: {
			username: githubUser.login
		}
	});
	return user;
};

const user = await getUser();
```

## Get authenticated user

You can validate requests and get the current session/user by using [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). It returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

You can see that `User.username` exists because we defined it with `getUserAttributes()` configuration.

```ts
get("/user", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		const user = session.user;
		const username = user.username;
		// ...
	}
	// ...
});
```

## Sign out users

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
