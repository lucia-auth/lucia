---
title: "Tutorial: GitHub OAuth in Next.js"
---

# Tutorial: GitHub OAuth in Next.js

_Before starting, make sure you've created the session and cookie API outlined in the [Sessions](/sessions/overview) page._

An [example project](https://github.com/lucia-auth/example-nextjs-github-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/example-nextjs-github-oauth).

```
git clone git@github.com:lucia-auth/example-nextjs-github-oauth.git
```

## Create an OAuth App

[Create a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the redirect URI to `http://localhost:3000/login/github/callback`. Copy and paste the client ID and secret to your `.env` file.

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

export const github = new GitHub(
	process.env.GITHUB_CLIENT_ID,
	process.env.GITHUB_CLIENT_SECRET,
	null
);
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

Create an Route Handlers in `app/login/github/route.ts`. Generate a new state and create a new authorization URL. Store the state and redirect the user to the authorization URL. The user will be redirected to GitHub's sign in page.

```ts
// app/login/github/route.ts
import { generateState } from "arctic";
import { github } from "@/lib/oauth";
import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
	const state = generateState();
	const url = github.createAuthorizationURL(state, []);

	cookies().set("github_oauth_state", state, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
```

## Validate callback

Create an Route Handlers in `app/login/github/callback/route.ts` to handle the callback. Check that the state in the URL matches the one that's stored. Then, validate the authorization code and stored code verifier. Use the access token to get the user's profile with the GitHub API. Check if the user is already registered; if not, create a new user. Finally, create a new session and set the session cookie to complete the authentication process.

```ts
// app/login/github/callback/route.ts
import { generateSessionToken, createSession, setSessionTokenCookie } from "@/lib/session";
import { github } from "@/lib/oauth";
import { cookies } from "next/headers";

import type { OAuth2Tokens } from "arctic";

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies().get("github_oauth_state")?.value ?? null;
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
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	}

	// TODO: Replace this with your own DB query.
	const user = await createUser(githubUserId, githubUsername);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(sessionToken, session.expiresAt);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/"
		}
	});
}
```

## Validate requests

Use the `getCurrentSession()` function from the [Session cookies in Next.js](/sessions/cookies/nextjs) page to get the current user and session.

```tsx
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function Page() {
	const { user } = await getCurrentSession();
	if (user === null) {
		return redirect("/login");
	}
	return <h1>Hi, {user.username}!</h1>;
}
```

## Sign out

Sign out users by invalidating their session. Make sure to remove the session cookie as well.

```tsx
import { getCurrentSession, invalidateSession, deleteSessionTokenCookie } from "@/lib/session";
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
	const { session } = await getCurrentSession();
	if (!session) {
		return {
			error: "Unauthorized"
		};
	}

	await invalidateSession(session.id);
	deleteSessionTokenCookie();
	return redirect("/login");
}

interface ActionResult {
	error: string | null;
}
```
