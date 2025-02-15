---
title: "Tutorial: Google OAuth in Next.js"
---

# Tutorial: Google OAuth in Next.js

_Before starting, make sure you've created the session and cookie API outlined in the [Sessions](/sessions/overview) page._

An [example project](https://github.com/lucia-auth/example-nextjs-google-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/example-nextjs-google-oauth).

```
git clone git@github.com:lucia-auth/example-nextjs-google-oauth.git
```

## Create an OAuth App

Create an Google OAuth client on the Cloud Console. Set the redirect URI to `http://localhost:3000/login/google/callback`. Copy and paste the client ID and secret to your `.env` file.

```bash
# .env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## Update database

Update your user model to include the user's Google ID and username.

```ts
interface User {
	id: number;
	googleId: string;
	name: string;
}
```

## Setup Arctic

```
npm install arctic
```

Initialize the Google provider with the client ID, client secret, and redirect URI.

```ts
import { Google } from "arctic";

export const google = new Google(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	"http://localhost:3000/login/google/callback"
);
```

## Sign in page

Create `app/login/page.tsx` and add a basic sign in button, which should be a link to `/login/google`.

```tsx
// app/login/page.tsx
export default async function Page() {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/google">Sign in with Google</a>
		</>
	);
}
```

## Create authorization URL

Create an API route in `app/login/google/route.ts`. Generate a new state and code verifier, and create a new authorization URL. Add the `openid` and `profile` scope to have access to the user's profile later on. Store the state and code verifier, and redirect the user to the authorization URL. The user will be redirected to Google's sign in page.

```ts
// app/login/google/route.ts
import { generateState, generateCodeVerifier } from "arctic";
import { google } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile"]);

	const cookieStore = await cookies();
	cookieStore.set("google_oauth_state", state, {
		path: "/",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 10, // 10 minutes
		sameSite: "lax"
	});
	cookieStore.set("google_code_verifier", codeVerifier, {
		path: "/",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 10, // 10 minutes
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

Create an Route Handlers in `app/login/google/callback/route.ts` to handle the callback. Check that the state in the URL matches the one that's stored. Then, validate the authorization code and stored code verifier. If you passed the `openid` and `profile` scope, Google will return a token ID with the user's profile. Check if the user is already registered; if not, create a new user. Finally, create a new session and set the session cookie to complete the authentication process.

```ts
// app/login/google/callback/route.ts
import { generateSessionToken, createSession, setSessionTokenCookie } from "@/lib/session";
import { google } from "@/lib/oauth";
import { cookies } from "next/headers";
import { decodeIdToken } from "arctic";

import type { OAuth2Tokens } from "arctic";

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const cookieStore = await cookies();
	const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
	const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;
	if (code === null || state === null || storedState === null || codeVerifier === null) {
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
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch (e) {
		// Invalid code or client credentials
		return new Response(null, {
			status: 400
		});
	}
	const claims = decodeIdToken(tokens.idToken());
	const googleUserId = claims.sub;
	const username = claims.name;

	// TODO: Replace this with your own DB query.
	const existingUser = await getUserFromGoogleId(googleUserId);

	if (existingUser !== null) {
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		await setSessionTokenCookie(sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	}

	// TODO: Replace this with your own DB query.
	const user = await createUser(googleUserId, username);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	await setSessionTokenCookie(sessionToken, session.expiresAt);
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
	return <h1>Hi, {user.name}!</h1>;
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
	await deleteSessionTokenCookie();
	return redirect("/login");
}

interface ActionResult {
	error: string | null;
}
```
