---
title: "GitHub OAuth in Next.js App router"
---

# Tutorial: GitHub OAuth in Next.js App router

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/nextjs-app) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/nextjs-app/github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-app/github-oauth).

```
npx degit https://github.com/lucia-auth/examples/nextjs-app/github-oauth <directory_name>
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:3000/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

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
		expires: false,
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

Create `app/login/page.tsx` and add a basic sign in button, which should be a link to `/login/github`.

```tsx
// app/login/page.tsx
export default async function Page() {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with GitHub</a>
		</>
	);
}
```

## Create authorization URL

Create an Route Handlers in `app/login/github/route.ts`. Generate a new state, create a new authorization URL with createAuthorizationURL(), store the state, and redirect the user to the authorization URL. The user will be prompted to sign in with GitHub.

```ts
// app/login/github/route.ts
import { generateState } from "arctic";
import { github } from "../../../lib/auth";
import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
	const state = generateState();
	const url = await github.createAuthorizationURL(state);

	cookies().set("github_oauth_state", state, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return Response.redirect(url);
}
```

## Validate callback

Create an Route Handlers in `app/login/github/callback/route.ts` to handle the callback. First, get the state from the cookie and the search params and compare them. Validate the authorization code in the search params with `validateAuthorizationCode()`. This will throw an [`OAuth2RequestError`](https://oslo.js.org/reference/oauth2/OAuth2RequestError) if the code or credentials are invalid. After validating the code, get the user's profile using the access token. Check if the user is already registered with the GitHub ID, and create a new user if they aren't. Finally, create a new session and set the session cookie.

```ts
// app/login/github/callback/route.ts
import { github, lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies().get("github_oauth_state")?.value ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
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
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return new Response(null, {
				status: 302,
				headers: {
					Location: "/"
				}
			});
		}

		const userId = generateIdFromEntropySize(10); // 16 characters long

		// Replace this with your own DB client.
		await db.table("user").insert({
			id: userId,
			github_id: githubUser.id,
			username: githubUser.login
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GitHubUser {
	id: string;
	login: string;
}
```

## Validate requests

Create `validateRequest()`. This will check for the session cookie, validate it, and set a new cookie if necessary. Make sure to catch errors when setting cookies and wrap the function with `cache()` to prevent unnecessary database calls. To learn more, see the [Validating requests](/guides/validate-session-cookies/nextjs-app) page.

CSRF protection should be implemented but Next.js handles it when using form actions (but not for Route Handlers).

```ts
import { cookies } from "next/headers";
import { cache } from "react";

import type { Session, User } from "lucia";

export const lucia = new Lucia();

export const validateRequest = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			return {
				user: null,
				session: null
			};
		}

		const result = await lucia.validateSession(sessionId);
		// next.js throws when you attempt to set cookie when rendering page
		try {
			if (result.session && result.session.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch {}
		return result;
	}
);
```

This function can then be used in server components and form actions to get the current session and user. 

```tsx
import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";

export default async function Page() {
	const { user } = await validateRequest();
	if (!user) {
		return redirect("/login");
	}
	return <h1>Hi, {user.username}!</h1>;
}
```

> Note: This code is not suitable for use in `layout.tsx` files. Layouts do not re-render on page transitions, so the authentication check won't run for each route change.

## Sign out

Sign out users by invalidating their session with `Lucia.invalidateSession()`. Make sure to remove their session cookie by setting a blank session cookie created with `Lucia.createBlankSessionCookie()`.

```tsx
import { lucia, validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page() {
	return (
		<form action={logout}>
			<button>Sign out</button>
		</form>
	);
}

async function logout(): Promise<ActionResult> {
	"use server";
	const { session } = await validateRequest();
	if (!session) {
		return {
			error: "Unauthorized"
		};
	}

	await lucia.invalidateSession(session.id);

	const sessionCookie = lucia.createBlankSessionCookie();
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/login");
}

interface ActionResult {
	error: string | null;
}
```
