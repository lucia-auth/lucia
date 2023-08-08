---
title: "Github OAuth in SolidStart"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth"
menuTitle: "SolidStart"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/solidstart) and that you've implement the recommended middleware._

This guide will cover how to implement Github OAuth using Lucia in SolidStart. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and Github redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Clone project

You can get started immediately by cloning the [SolidStart example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/solidstart/github-oauth) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/solidstart/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/solidstart/github-oauth).

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

Make sure you update `Lucia.DatabaseUserAttributes` in `app.d.ts` whenever you add any new columns to the user table.

```ts
// src/app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lib/lucia").Auth;
	type DatabaseUserAttributes = {
		github_username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's Github username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// src/auth/lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
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

Install the OAuth integration.

```
npm i @lucia-auth/oauth
pnpm add @lucia-auth/oauth
yarn add @lucia-auth/oauth
```

Import the Github OAuth integration, and initialize it using your credentials.

```ts
// src/auth/lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
```

## Sign in page

Create `src/routes/login/index.tsx`. It will have a "Sign in with Github" button (actually a link). Make sure you use the regular HTML anchor tags.

```tsx
// src/routes/login/index.tsx
const Page = () => {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with Github</a>
		</>
	);
};

export default Page;
```

When a user clicks the link, the destination (`/login/github`) will redirect the user to Github to be authenticated.

## Generate authorization url

Create `src/routes/login/github/index.ts` and handle GET requests. [`GithubProvider.getAuthorizationUrl()`](/oauth/providers/github#getauthorizationurl) will create a new Github authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
// src/routes/login/github/index.ts
import { auth, githubAuth } from "~/auth/lucia";
import { redirect } from "solid-start";
import { serializeCookie } from "solid-start";

import type { APIEvent } from "solid-start";

export const GET = async (event: APIEvent) => {
	const authRequest = auth.handleRequest(event.request);
	const session = await authRequest.validate();
	if (session) {
		return redirect("/", 302); // redirect to profile page
	}
	const [url, state] = await githubAuth.getAuthorizationUrl();
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString(),
			"Set-Cookie": serializeCookie("github_oauth_state", state, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				path: "/",
				maxAge: 60 * 60
			})
		}
	});
};
```

## Validate callback

Create `src/routes/login/github/callback.ts` and handle GET requests.

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). Since we've setup middleware, `AuthRequest` is accessible as `context.locals.auth`.

```ts
// src/routes/login/github/callback.ts
import { auth, githubAuth } from "~/auth/lucia";
import { OAuthRequestError } from "@lucia-auth/oauth";
import { parseCookie, redirect } from "solid-start";

import type { APIEvent } from "solid-start";

export const GET = async (event: APIEvent) => {
	const authRequest = auth.handleRequest(event.request);
	const session = await authRequest.validate();
	if (session) {
		return redirect("/", 302); // redirect to profile page
	}
	const cookies = parseCookie(event.request.headers.get("Cookie") ?? "");
	const storedState = cookies.github_oauth_state;
	const url = new URL(event.request.url);
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
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize()
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

### Authenticate user with Lucia

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

```tsx
// src/routes/login/index.tsx
import { auth } from "~/auth/lucia";
import { createServerData$, redirect } from "solid-start/server";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (session) {
			return redirect("/");
		}
	});
};

const Page = () => {
	// ...
};

export default Page;
```

## Profile page

Create `src/routes/index.tsx`. This page will show some basic user info and include a logout button.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you’ll see that `User.githubUsername` exists because we defined it in first step with `getUserAttributes()` configuration.

```tsx
// src/routes/index.tsx
import { useRouteData } from "solid-start";
import { createServerData$, redirect } from "solid-start/server";
import { auth } from "~/auth/lucia";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (!session) {
			return redirect("/login") as never;
		}
		return session.user;
	});
};

const Page = () => {
	const user = useRouteData<typeof routeData>();
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {user()?.userId}</p>
			<p>Github username: {user()?.githubUsername}</p>
		</>
	);
};

export default Page;
```

### Sign out users

The form submission will be handled within a server action.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```tsx
// src/routes/index.tsx
import { useRouteData } from "solid-start";
import {
	ServerError,
	createServerAction$,
	createServerData$,
	redirect
} from "solid-start/server";
import { auth } from "~/auth/lucia";

export const routeData = () => {
	// ...
};

const Page = () => {
	const user = useRouteData<typeof routeData>();
	const [_, { Form }] = createServerAction$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (!session) {
			throw new ServerError("Unauthorized", {
				status: 401
			});
		}
		await auth.invalidateSession(session.sessionId); // invalidate session
		const sessionCookie = auth.createSessionCookie(null);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	});
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {user()?.userId}</p>
			<p>Username: {user()?.username}</p>
			<Form>
				<button>Sign out</button>
			</Form>
		</>
	);
};

export default Page;
```
