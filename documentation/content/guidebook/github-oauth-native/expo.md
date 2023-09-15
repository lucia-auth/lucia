---
title: "Github OAuth in Expo"
description: "Learn how to implement Github OAuth in Expo mobile applications"
---

> These guides are not beginner friendly and do not cover the basics of Lucia. We recommend reading the [Github OAuth](http://localhost:3000/guidebook/github-oauth) guide for regular websites first.

We'll be using bearer tokens instead of cookies to validate users. For the most part, authenticating the user is identical to regular web applications. The user is redirected to Github, then back to your server with a `code`, which is then exchanged for an access token, and a new user/session is created.

To send the session token (ie. session id) from the server back to our application, we'll be using deep-links which allow us to open applications using a url.

### Clone project

You can get started immediately by cloning the [example](https://github.com/lucia-auth/examples/tree/main/expo/github-oauth) from the repository.

```
npx degit lucia-auth/examples/expo/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/expo/github-oauth).

## Server

Make sure you've installed `lucia` and `@lucia-auth/oauth`, create 4 API routes:

- GET `/user`: Returns the current user
- GET `/login/github`: Redirects the user to the Github authorization url
- GET `/login/github/callback`: Handles callback from Github and redirects the user to the localhost server with the session id
- POST `/logout`: Handles logouts

This example uses [Hono](https://hono.dev) but you should be able to easily convert it to whatever framework you use.

There are few key differences between the code for regular web applications. First, we'll be using bearer tokens instead of cookies. As such, [`AuthRequest.validateBearerToken()`](/reference/lucia/interfaces/authrequest#validatebearertoken) is used instead of `AuthRequest.validate()`. We'll send the user back to the application with a deep-link, where the session token is stored as a search params. The guide uses port 8081 (the default port) for the redirect, but it may differ for your application.

```ts
import { lucia } from "lucia";
import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

export type Auth = typeof auth;

export const githubAuth = github(auth, {
	clientId,
	clientSecret
});
```

```ts
import { auth, githubAuth } from "./auth";
import { OAuthRequestError } from "@lucia-auth/oauth";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const app = new Hono();

app.get("/user", async (c) => {
	const authRequest = auth.handleRequest(c);
	const session = await authRequest.validateBearerToken();
	if (!session) {
		return c.newResponse(null, 401);
	}
	return c.json(session.user);
});

app.get("/login/github", async (c) => {
	const [authorizationUrl, state] = await githubAuth.getAuthorizationUrl();
	setCookie(c, "github_oauth_state", state, {
		path: "/",
		maxAge: 60 * 10, // 10 min
		httpOnly: true,
		secure: process.env.NODE_ENV === "production"
	});
	return c.redirect(authorizationUrl.toString());
});

app.get("/login/github/callback", async (c) => {
	const url = new URL(c.req.url);
	const code = url.searchParams.get("code");
	if (!code) return c.newResponse(null, 400);
	const state = url.searchParams.get("state");
	const storedState = getCookie(c, "github_oauth_state");
	if (!state || !storedState || state !== storedState) {
		return c.newResponse(null, 400);
	}
	try {
		const { getExistingUser, githubUser, createUser } =
			await githubAuth.validateCallback(code);
		let user = await getExistingUser();
		if (!user) {
			user = await createUser({
				attributes: {
					username: githubUser.login
				}
			});
		}
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		return c.redirect(
			`exp://192.168.2.100:8081/login?session_token=${session.sessionId}`
		);
	} catch (e) {
		console.log(e);
		if (e instanceof OAuthRequestError) {
			// invalid code
			return c.newResponse(null, 400);
		}
		return c.newResponse(null, 500);
	}
});

app.post("/logout", async (c) => {
	const authRequest = auth.handleRequest(c);
	const session = await authRequest.validateBearerToken();
	if (!session) return c.newResponse(null, 401);
	await auth.invalidateSession(session.sessionId);
	return c.newResponse(null, 200);
});

serve(app);
```

## Expo app

Make sure you have installed `expo-web-browser`, `expo-linking`, and `expo-secure-store`.

```
npm i expo-web-browser expo-linking expo-secure-store
```

Use `Browser.openAuthSessionAsync()` to open a new browser window within the app and listen for the callback. Parse the url and store the session token with `SecureStore`.

```tsx
// app/App.tsx
import * as Browser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

export default function App() {
	const signIn = async (): Promise<User | null> => {
		const result = await Browser.openAuthSessionAsync(
			"http://localhost:3000/login/github",
			"exp://192.168.2.100:8081/login"
		);
		if (result.type !== "success") return;
		const url = Linking.parse(result.url);
		const sessionToken = url.queryParams?.session_token?.toString() ?? null;
		if (!sessionToken) return;
		const user = await getUser(sessionToken);
		await SecureStore.setItemAsync("session_token", sessionToken);
		// ...
	};

	// ...
}

const signOut = async () => {
	const sessionToken = await SecureStore.getItemAsync("session_token");
	const response = await fetch("http://localhost:3000/logout", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${sessionToken}`
		}
	});
	if (!response.ok) return;
	await SecureStore.deleteItemAsync("session_token");
};

const getUser = async (sessionToken: string): Promise<User | null> => {
	const response = await fetch("http://localhost:3000/user", {
		headers: {
			Authorization: `Bearer ${sessionToken}`
		}
	});
	if (!response.ok) return null;
	return await response.json();
};

type User = {
	userId: string;
	username: string;
};
```
