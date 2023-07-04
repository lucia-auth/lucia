---
title: "Github OAuth in Next.js Pages Router"
description: "Learn the basic of Lucia and the OAuth integration by implementing Github OAuth in Next.js Pages Router"
menuTitle: "Next.js Pages Router"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/nextjs-pages)._

This guide will cover how to implement Github OAuth using Lucia in Next.js Pages Router. It will have 3 parts:

- A sign up page
- An endpoint to authenticate users with Github
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the Next.js example from the repository.

```
npx degit pilcrowonpaper/lucia/examples/nextjs-pages/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/nextjs-pages/github-oauth).

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
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs(),

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

Create `pages/login.tsx`. It will have a "Sign in with Github" button (actually a link).

```tsx
// pages/login.tsx

const Page = () => {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/api/login/github">Sign in with Github</a>
		</>
	);
};

export default Page;
```

When a user clicks the link, the destination (`/api/login/github`) will redirect the user to Github to be authenticated.

## Authenticate with Github

As a general overview of OAuth, the user is redirected to github.com to be authenticated, and Github redirects the user back to your application with a code that can be validated and used to get the user's identity.

### Generate authorization url

Create ` pages/api/login/github.ts` and handle GET requests. [`GithubProvider.getAuthorizationUrl()`](/oauth/providers/github#getauthorizationurl) will create a new Github authorization url, where the user will be authenticated in github.com. When generating an authorization url, Lucia will also create a new state. This should be stored as a http-only cookie to be used later.

```ts
// pages/api/login/github.ts
import { auth, githubAuth } from "@/auth/lucia";
import { serializeCookie } from "lucia/utils";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET") return res.status(405);
	const [url, state] = await githubAuth.getAuthorizationUrl();
	const stateCookie = serializeCookie("github_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60
	});
	return res
		.status(302)
		.setHeader("Set-Cookie", stateCookie)
		.setHeader("Location", url.toString())
		.end();
};

export default handler;
```

### Validate callback

Create `pages/api/login/github/callback.ts` and handle GET requests.

When the user authenticates with Github, Github will redirect back the user to your site with a code and a state. This state should be checked with the one stored as a cookie, and if valid, validate the code with [`GithubProvider.validateCallback()`](/oauth/providers/github#validatecallback). This will return [`GithubUserAuth`](/oauth/providers/github#githubuserauth) if the code is valid, or throw an error if not.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). [`AuthRequest`](/reference/lucia/interfaces/authrequest) can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with `IncomingMessage` and `OutgoingMessage`.

```ts
// pages/api/login/github/callback.ts
import { auth, githubAuth } from "@/auth/lucia";
import { OAuthRequestError } from "@lucia-auth/oauth";
import { parseCookie } from "lucia/utils";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET") return res.status(405);
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
		return res.status(400).end();
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
		const authRequest = auth.handleRequest({ req, res });
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end(); // redirect to profile page
	} catch (e) {
		if (e instanceof OAuthRequestError) {
			// invalid code
			return res.status(400).end();
		}
		return res.status(500).end();
	}
};

export default handler;
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

Authenticated users should be redirected to the profile page whenever they try to access the sign in page. You can validate requests by creating by calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

Since `Request` is not available in pages, set it to `null`. This should only be done for GET requests.

```tsx
// app/login/page.tsx
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
	const authRequest = auth.handleRequest({
		request: null,
		cookies
	});
	const session = await authRequest.validate();
	if (session) redirect("/");
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with Github</a>
		</>
	);
};

export default Page;
```

## Profile page

Create `pages/index.tsx`. This page will show some basic user info and include a logout button.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you’ll see that `User.githubUsername` exists because we defined it in first step with `getUserAttributes()` configuration.

```tsx
// pages/index.tsx
import { auth } from "@/auth/lucia";
import { useRouter } from "next/router";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<
	GetServerSidePropsResult<{
		userId: string;
		githubUsername: string;
	}>
> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (!session) {
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	}
	return {
		props: {
			userId: session.user.userId,
			githubUsername: session.user.githubUsername
		}
	};
};

const Page = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	const router = useRouter();
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {props.userId}</p>
			<p>Github username: {props.githubUsername}</p>
			<form
				method="post"
				action="/api/logout"
				onSubmit={async (e) => {
					e.preventDefault();
					const response = await fetch("/api/logout", {
						method: "POST",
						redirect: "manual"
					});
					if (response.status === 0 || response.ok) {
						router.push("/login"); // redirect to login page on success
					}
				}}
			>
				<input type="submit" value="Sign out" />
			</form>
		</>
	);
};

export default Page;
```

### Sign out users

Create `pages/api/logout.ts` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
// pages/api/logout.ts
import { auth } from "@/auth/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405);
	const authRequest = auth.handleRequest({ req, res });
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return res.status(401).json({
			error: "Not authenticated"
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	authRequest.setSession(null);
	return res.redirect(302, "/login");
};

export default handler;
```
