---
title: "OAuth basics"
---

# OAuth basics

For a step-by-step, framework-specific tutorial, see the [GitHub OAuth](/tutorials) tutorial.

We recommend using [Arctic](https://github.com/pilcrowonpaper/arctic) for implementing OAuth 2.0. It is a lightweight library that provides APIs for creating authorization URLs, validating callbacks, and refreshing access tokens. This is the easiest way to implement OAuth with Lucia and it supports most major providers. This page will use GitHub, and while most providers have similar APIs, there might be some minor differences between them.

```
npm install arctic
```

For this guide, the callback URL is `<domain>/login/github/callback`, for example `http://localhost:3000/login/github/callback`.

## Update database

Add a `username` and a unique `github_id` column to the user table.

| column      | type     | attributes |
| ----------- | -------- | ---------- |
| `username`  | `string` |            |
| `github_id` | `number` | unique     |

Declare the type with `DatabaseUserAttributes` and add the attributes to the user object using the `getUserAttributes()` configuration.

```ts
// auth.ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env === "PRODUCTION" // set `Secure` flag in HTTPS
		}
	},
	getUserAttributes: (attributes) => {
		return {
			githubId: attributes.github_id,
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			github_id: number;
			username: string;
		};
	}
}
```

## Initialize OAuth provider

Import `GitHub` from Arctic and initialize it with the client ID and secret.

```ts
// auth.ts
import { GitHub } from "arctic";

export const github = new GitHub(clientId, clientSecret);
```

## Creating authorization URL

Create a route to handle authorization. Generate a new state, create a new authorization URL with `createAuthorizationURL()`, store the state, and redirect the user to the authorization URL. The user will be prompted to sign in with GitHub.

```ts
import { github } from "./auth.js";
import { generateState } from "arctic";
import { serializeCookie } from "oslo/cookie";

app.get("/login/github", async (): Promise<Response> => {
	const state = generateState();
	const url = await github.createAuthorizationURL(state);
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString(),
			"Set-Cookie": serializeCookie("github_oauth_state", state, {
				httpOnly: true,
				secure: env === "PRODUCTION", // set `Secure` flag in HTTPS
				maxAge: 60 * 10, // 10 minutes
				path: "/"
			})
		}
	});
});
```

You can now create a sign in button with just an anchor tag.

```html
<a href="/login/github">Sign in with GitHub</a>
```

## Validate callback

In the callback route, first get the state from the cookie and the search params and compare them. Validate the authorization code in the search params with `validateAuthorizationCode()`. This will throw an [`OAuth2RequestError`](https://oslo.js.org/reference/oauth2/OAuth2RequestError) if the code or credentials are invalid. After validating the code, get the user's profile using the access token. Check if the user is already registered with the GitHub ID, and create a new user if they aren't. Finally, create a new session and set the session cookie.

```ts
import { github, lucia } from "./auth.js";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { parseCookies } from "oslo/cookie";

app.get("/login/github/callback", async (request: Request): Promise<Response> => {
	const cookies = parseCookies(request.headers.get("Cookie") ?? "");
	const stateCookie = cookies.get("github_oauth_state") ?? null;

	const url = new URL(request.url);
	const state = url.searchParams.get("state");
	const code = url.searchParams.get("code");

	// verify state
	if (!state || !stateCookie || !code || stateCookie !== state) {
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
		const githubUserResult: GitHubUserResult = await githubUserResponse.json();

		const existingUser = await db
			.table("user")
			.where("github_id", "=", githubUserResult.id)
			.get();

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			return new Response(null, {
				status: 302,
				headers: {
					Location: "/",
					"Set-Cookie": sessionCookie.serialize()
				}
			});
		}

		const userId = generateIdFromEntropySize(10); // 16 characters long
		await db.table("user").insert({
			id: userId,
			username: githubUserResult.login,
			github_id: githubUserResult.id
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	} catch (e) {
		console.log(e);
		if (e instanceof OAuth2RequestError) {
			// bad verification code, invalid credentials, etc
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
});

interface GitHubUserResult {
	id: number;
	login: string; // username
}
```
