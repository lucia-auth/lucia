---
title: "PKCE flow"
---

# PKCE flow

## Create authorization URL

Create a code verifier with `generateCodeVerifier()`, pass it to `createAuthorizationURL()`, and store it as a cookie alongside the state.

```ts
import { twitterAuth } from "./auth.js";
import { generateState, generateCodeVerifier } from "arctic";
import { serializeCookie } from "oslo/cookie";

app.get("/login/twitter", async (): Promise<Response> => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await twitterAuth.createAuthorizationURL(state, codeVerifier);

	const headers = new Headers();
	headers.append(
		"Set-Cookie",
		serializeCookie("twitter_oauth_state", state, {
			httpOnly: true,
			secure: env === "PRODUCTION", // set `Secure` flag in HTTPS
			maxAge: 60 * 10, // 10 minutes
			path: "/"
		})
	);
	headers.append(
		"Set-Cookie",
		serializeCookie("code_verifier", codeVerifier, {
			httpOnly: true,
			secure: env === "PRODUCTION",
			maxAge: 60 * 10,
			path: "/"
		})
	);

	// ...
});
```

## Validate callback

Get the code verifier stored as a cookie and use it alongside the authorization code to validate the callback.

```ts
import { twitterAuth, lucia } from "./auth.js";
import { parseCookies } from "oslo/cookie";

app.get("/login/twitter/callback", async (request: Request): Promise<Response> => {
	const cookies = parseCookies(request.headers.get("Cookie") ?? "");
	const stateCookie = cookies.get("twitter_oauth_state") ?? null;
	const codeVerifier = cookies.get("code_verifier") ?? null;

	const url = new URL(request.url);
	const state = url.searchParams.get("state");
	const code = url.searchParams.get("code");

	// verify state
	if (!state || !stateCookie || !code || stateCookie !== state || !codeVerifier) {
		return new Response(null, {
			status: 400
		});
	}

	const tokens = await twitterAuth.validateAuthorizationCode(code, codeVerifier);

	// ...
});
```
