---
title: "GitHub OAuth in Next.js Pages router"
---

# Tutorial: GitHub OAuth in Next.js Pages router

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/nextjs-pages) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/nextjs-pages/github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-pages/github-oauth).

```
npx degit https://github.com/lucia-auth/examples/tree/main/nextjs-pages/github-oauth <directory_name>
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:3000/api/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

```bash
# .env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Update database

Add a `github_id` and `username` column to your user table.

| column      | type     | attributes |
| ----------- | -------- | ---------- |
| `github_id` | `number` | unique     |
| `username`  | `string` |            |

Create a `DatabaseUserAttributes` interface in the module declaration and add your database columns. By default, Lucia will not expose any database columns to the `User` type. To add a `githubId` and `username` field to it, use the `getUserAttributes()` option.

```ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === "production"
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			githubId: attributes.github_id,
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	github_id: number;
	username: string;
}
```

## Setup Arctic

We recommend using [Arctic](https://arctic.js.org) for implementing OAuth. It is a lightweight library that provides APIs for creating authorization URLs, validating callbacks, and refreshing access tokens. This is the easiest way to implement OAuth with Lucia and it supports most major providers.

```
npm install arctic
```

Initialize the GitHub provider with the client ID and secret.

```ts
import { GitHub } from "arctic";

export const github = new GitHub(process.env.GITHUB_CLIENT_ID!, process.env.GITHUB_CLIENT_SECRET!);
```

## Sign in page

Create `pages/login.tsx` and add a basic sign in button, which should be a link to `/login/github`.

```tsx
// pages/login.tsx
export default function Page() {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with GitHub</a>
		</>
	);
}
```

## Create authorization URL

Create an API route in `pages/api/login/github/index.ts`. Generate a new state, create a new authorization URL with createAuthorizationURL(), store the state, and redirect the user to the authorization URL. The user will be prompted to sign in with GitHub.

```ts
// pages/api/login/github/index.ts
import { github } from "@/lib/auth";
import { generateState } from "arctic";
import { serializeCookie } from "oslo/cookie";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") {
		res.status(404).end();
		return;
	}
	const state = generateState();
	const url = await github.createAuthorizationURL(state);
	res.appendHeader(
		"Set-Cookie",
		serializeCookie("github_oauth_state", state, {
			path: "/",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: "lax"
		})
	).redirect(url.toString());
}
```

## Validate callback

Create an API route in `pages/api/login/github/callback.ts` to handle the callback. First, get the state from the cookie and the search params and compare them. Validate the authorization code in the search params with `validateAuthorizationCode()`. This will throw an [`OAuth2RequestError`](https://oslo.js.org/reference/oauth2/OAuth2RequestError) if the code or credentials are invalid. After validating the code, get the user's profile using the access token. Check if the user is already registered with the GitHub ID, and create a new user if they aren't. Finally, create a new session and set the session cookie.

```ts
// pages/api/login/github/callback.ts
import { github, lucia } from "@/lib/auth";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") {
		res.status(404).end();
		return;
	}
	const code = req.query.code?.toString() ?? null;
	const state = req.query.state?.toString() ?? null;
	const storedState = req.cookies.github_oauth_state ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		console.log(code, state, storedState);
		res.status(400).end();
		return;
	}
	try {
		const tokens = await github.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const githubUser: GitHubUser = await githubUserResponse.json();

		// Replace this with your own DB client.
		const existingUser = await db.table("user").where("github_id", "=", githubUser.id).get();

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			return res
				.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
				.redirect("/");
		}

		const userId = generateIdFromEntropySize(10); // 16 characters long

		// Replace this with your own DB client.
		await db.table("user").insert({
			id: userId,
			github_id: githubUser.id,
			username: githubUser.login
		});

		const session = await lucia.createSession(userId, {});
		return res
			.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
			.redirect("/");
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		res.status(500).end();
		return;
	}
}

interface GitHubUser {
	id: string;
	login: string;
}
```

## Validate requests

Create `validateRequest()`. This will check for the session cookie, validate it, and set a new cookie if necessary. To learn more, see the [Validating requests](/guides/validate-session-cookies/nextjs-pages) page.

CSRF protection should be implemented and you should already have a middleware for it.

```ts
import type { Session, User } from "lucia";
import type { IncomingMessage, ServerResponse } from "http";

export const lucia = new Lucia();

export async function validateRequest(
	req: IncomingMessage,
	res: ServerResponse
): Promise<{ user: User; session: Session } | { user: null; session: null }> {
	const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
	if (!sessionId) {
		return {
			user: null,
			session: null
		};
	}
	const result = await lucia.validateSession(sessionId);
	if (result.session && result.session.fresh) {
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(result.session.id).serialize());
	}
	if (!result.session) {
		res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	return result;
}
```

This function can then be used in both `getServerSideProps()` and API routes.

```tsx
import { validateRequest } from "@/lib/auth";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";
import type { User } from "lucia";

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<
	GetServerSidePropsResult<{
		user: User;
	}>
> {
	const { user } = await validateRequest(context.req, context.res);
	if (!user) {
		return {
			redirect: {
				permanent: false,
				destination: "/login"
			}
		};
	}
	return {
		props: {
			user
		}
	};
}

export default function Page({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return <h1>Hi, {user.username}!</h1>;
}
```

## Sign out

Sign out users by invalidating their session with `Lucia.invalidateSession()`. Make sure to remove their session cookie by setting a blank session cookie created with `Lucia.createBlankSessionCookie()`.

```ts
// pages/api/logout.ts
import { lucia, validateRequest } from "@/lib/auth";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		res.status(404).end();
		return;
	}
	const { session } = await validateRequest(req, res);
	if (!session) {
		res.status(401).end();
		return;
	}
	await lucia.invalidateSession(session.id);
	res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize()).status(200).end();
}
```

```tsx
import { useRouter } from "next/router";

import type { FormEvent } from "react";

export default function Page({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const router = useRouter();

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formElement = e.target as HTMLFormElement;
		await fetch(formElement.action, {
			method: formElement.method
		});
		router.push("/login");
	}

	return (
		<form method="post" action="/api/logout" onSubmit={onSubmit}>
			<button>Sign out</button>
		</form>
	);
}
```
