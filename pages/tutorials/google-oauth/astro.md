---
title: "Tutorial: Google OAuth in Astro"
---

# Tutorial: Google OAuth in Astro

_Before starting, make sure you've created the session and cookie API outlined in the [Sessions](/sessions/overview) page._

An [example project](https://github.com/lucia-auth/example-astro-google-oauth) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/example-astro-google-oauth).

```
git clone git@github.com:lucia-auth/example-astro-google-oauth.git
```

## Create an OAuth App

Create an Google OAuth client on the Cloud Console. Set the redirect URI to `http://localhost:4321/login/google/callback`. Copy and paste the client ID and secret to your `.env` file.

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

We recommend using [Arctic](https://arcticjs.dev) for implementing OAuth. Arctic is a lightweight OAuth client library that supports 50+ providers out of the box.

```
npm install arctic
```

Initialize the Google provider with the client ID and secret.

```ts
import { Google } from "arctic";

export const google = new Google(
	import.meta.env.GOOGLE_CLIENT_ID,
	import.meta.env.GOOGLE_CLIENT_SECRET,
	"http://localhost:4321/login/google/callback"
);
```

## Sign in page

Create `pages/login/index.astro` and add a basic sign in button, which should be a link to `/login/google`.

```html
<!-- pages/login/index.astro -->
<html lang="en">
	<body>
		<h1>Sign in</h1>
		<a href="/login/google">Sign in with Google</a>
	</body>
</html>
```

## Create authorization URL

Create an API route in `pages/login/google/index.ts`. Generate a new state and code verifier, and create a new authorization URL. Add the `openid` and `profile` scope to have access to the user's profile later on. Store the state and code verifier, and redirect the user to the authorization URL. The user will be redirected to Google's sign in page.

```ts
// pages/login/google/index.ts
import { generateState } from "arctic";
import { google } from "@lib/oauth";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await google.createAuthorizationURL(state, codeVerifier, ["openid", "profile"]);

	context.cookies.set("google_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: "lax"
	});
	context.cookies.set("google_code_verifier", codeVerifier, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: "lax"
	});

	return context.redirect(url.toString());
}
```

## Validate callback

Create an API route in `pages/login/google/callback.ts` to handle the callback. Check that the state in the URL matches the one that's stored. Then, validate the authorization code and stored code verifier. If you passed the `openid` and `profile` scope, Google will return a token ID with the user's profile. Check if the user is already registered; if not, create a new user. Finally, create a new session and set the session cookie to complete the authentication process.

```ts
// pages/login/google/callback.ts
import { generateSessionToken, createSession, setSessionTokenCookie } from "@lib/auth";
import { google } from "@lib/oauth";
import { decodeIdToken } from "arctic";

import type { APIContext } from "astro";
import type { OAuth2Tokens } from "arctic";

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
	const codeVerifier = context.cookies.get("google_code_verifier")?.value ?? null;
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
		const token = generateSessionToken();
		const session = await createSession(token, existingUser.id);
		setSessionTokenCookie(context, token, session.expiresAt);
		return context.redirect("/");
	}

	// TODO: Replace this with your own DB query.
	const user = await createUser(googleUserId, username);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(context, token, session.expiresAt);
	return context.redirect("/");
}
```

## Get the current user

If you implemented the middleware outlined in the [Session cookies in Astro](/sessions/cookies/astro) page, you can get the current session and user from `Locals`.

```ts
if (Astro.locals.user === null) {
	return Astro.redirect("/login");
}

const username = Astro.locals.user.name;
```

## Sign out

Sign out users by invalidating their session. Make sure to remove the session cookie as well.

```ts
import { invalidateSession, deleteSessionTokenCookie } from "@lib/auth";

import type { APIContext } from "astro";

export async function POST(context: APIContext): Promise<Response> {
	if (context.locals.session === null) {
		return new Response(null, {
			status: 401
		});
	}
	await invalidateSession(context.locals.session.id);
	deleteSessionTokenCookie(context);
	return context.redirect("/login");
}
```
