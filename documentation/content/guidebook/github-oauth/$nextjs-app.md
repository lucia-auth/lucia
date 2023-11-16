---
title: "GitHub OAuth in Next.js App Router"
description: "Learn the basic of Lucia and the OAuth integration by implementing GitHub OAuth"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started/nextjs-app)._

This guide will cover how to implement GitHub OAuth using Lucia in Next.js App router. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with GitHub
- A profile page with a logout button

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and GitHub redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Clone project

You can get started immediately by cloning the [Next.js example](https://github.com/lucia-auth/examples/tree/main/nextjs-app/github-oauth) from the repository.

```
npx degit lucia-auth/examples/nextjs-app/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-app/github-oauth).

## Create an OAuth app

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect uri to:

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

Set [`sessionCookie.expires`](/basics/configuration#sessioncookie) to false since we can't update the session cookie when validating them.

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs_future(),

	sessionCookie: {
		expires: false
	}
});

export type Auth = typeof auth;
```

We'll also expose the user's GitHub username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs_future(),
	sessionCookie: {
		expires: false
	},

	getUserAttributes: (data) => {
		return {
			githubUsername: data.username
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

Import the GitHub OAuth integration, and initialize it using your credentials.

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs } from "lucia/middleware";

import { github } from "@lucia-auth/oauth/providers";

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

Create `app/login/page.tsx`. It will have a "Sign in with GitHub" button (actually a link).

```tsx
// app/login/page.tsx

const Page = async () => {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with GitHub</a>
		</>
	);
};

export default Page;
```

When a user clicks the link, the destination (`/login/github`) will redirect the user to GitHub to be authenticated.

## Generate authorization url

Create `app/login/github/route.ts` and handle GET requests. [`GithubProvider.getAuthorizationUrl()`](/oauth/providers/github#getauthorizationurl) will create a new GitHub authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
// app/login/github/route.ts
import { githubAuth } from "@/auth/lucia";
import * as context from "next/headers";

import type { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	// store state
	context.cookies().set("github_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
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

## Validate callback

Create `app/login/github/callback/route.ts` and handle GET requests.

When the user authenticates with GitHub, GitHub will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). [`AuthRequest`](/reference/lucia/interfaces/authrequest) can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with the request method, `cookies()`, and `headers().

```ts
// app/login/github/callback/route.ts
import { auth, githubAuth } from "@/auth/lucia";
import { OAuthRequestError } from "@lucia-auth/oauth";
import { cookies, headers } from "next/headers";

import type { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
	const storedState = cookies().get("github_oauth_state")?.value;
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
		const authRequest = auth.handleRequest(request.method, {
			cookies,
			headers
		});
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/" // redirect to profile page
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

## Redirect authenticated users

Authenticated users should be redirected to the profile page whenever they try to access the sign in page. You can validate requests by creating by calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

For `Auth.handleRequest()`, pass `"GET"` as the request method.

```tsx
// app/login/page.tsx
import { auth } from "@/auth/lucia";
import * as context from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
	const authRequest = auth.handleRequest("GET", context);
	const session = await authRequest.validate();
	if (session) redirect("/");
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with GitHub</a>
		</>
	);
};

export default Page;
```

## Profile page

Create `app/page.tsx`. This page will show some basic user info and include a logout button.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.username` exists because we defined it in first step with `getUserAttributes()` configuration.

```tsx
// app/page.tsx
import { auth } from "@/auth/lucia";
import * as context from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form"; // expect error - see next section

const Page = async () => {
	const authRequest = auth.handleRequest("GET", context);
	const session = await authRequest.validate();
	if (!session) redirect("/login");
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {session.user.userId}</p>
			<p>Username: {session.user.username}</p>
			<Form action="/api/logout">
				<input type="submit" value="Sign out" />
			</Form>
		</>
	);
};

export default Page;
```

### Form component

Since the form will require client side JS, we will extract it into its own client component. We need to manually handle redirect responses as the default behavior is to make another request to the redirect location. We're going to use `refresh()` to reload the page (and redirect the user in the server) since we want to re-render the entire page, including `layout.tsx`.

```tsx
// components/form.tsx
"use client";

import { useRouter } from "next/navigation";

const Form = ({
	children,
	action
}: {
	children: React.ReactNode;
	action: string;
}) => {
	const router = useRouter();
	return (
		<form
			action={action}
			method="post"
			onSubmit={async (e) => {
				e.preventDefault();
				const formData = new FormData(e.currentTarget);
				const response = await fetch(action, {
					method: "POST",
					body: formData,
					redirect: "manual"
				});

				if (response.status === 0) {
					// redirected
					// when using `redirect: "manual"`, response status 0 is returned
					return router.refresh();
				}
			}}
		>
			{children}
		</form>
	);
};

export default Form;
```

### Sign out users

Create `app/api/logout/route.ts` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `AuthRequest.setSession()`.

```ts
// app/api/logout/route.ts
import { auth } from "@/auth/lucia";
import * as context from "next/headers";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
	const authRequest = auth.handleRequest(request.method, context);
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return new Response(null, {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	authRequest.setSession(null);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/login" // redirect to login page
		}
	});
};
```

## Additional notes

For getting the current user in `page.tsx` and `layout.tsx`, we recommend wrapping `AuthRequest.validate()` in `cache()`, which is provided by React. This should not be used inside `route.tsx` as Lucia will assume the request is a GET request.

```ts
export const getPageSession = cache(() => {
	const authRequest = auth.handleRequest("GET", context);
	return authRequest.validate();
});
```

This allows you share the session across pages and layouts, making it possible to validate the request in multiple layouts and page files without making unnecessary database calls.

```ts
const Page = async () => {
	const session = await getPageSession();
};
```
