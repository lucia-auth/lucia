---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

While Lucia doesn't directly support OAuth, we do provide an external library that handles OAuth using Lucia. This is a server-only module.

```bash
npm i lucia-auth @lucia-auth/oauth
pnpm add lucia-auth @lucia-auth/oauth
yarn add lucia-auth @lucia-auth/oauth
```

This can be initialized using Lucia's instance and provider-specific configs. Refer to each provider's documentation for the specifics.

```ts
import provider from "@lucia-auth/oauth/provider";
import { auth } from "./lucia.js";

const providerAuth = provider(auth, configs);
```

## Sign in with the provider

When a user clicks "Sign in with [provider]", store the [state](https://www.rfc-editor.org/rfc/rfc6749#section-4.1.1) in either a cookie or localstorage and redirect the user to the provider's authorization url. This will send the user to the provider's sign in page. Both, the authorization url and state can be retrieved with `getAuthorizationUrl()`.

```ts
// SERVER
import provider from "@lucia-auth/oauth/provider";
import { auth } from "./lucia.js";

const handleGetRequests = async () => {
	const providerAuth = provider(auth, configs);

	// get url to redirect the user to, with the state
	const [authUrl, state] = providerAuth.getAuthorizationUrl();

	// the state can be stored in cookies or localstorage for request validation on callback
	setCookie("state", state, {
		path: "/",
		httpOnly: true, // only readable in the server
		maxAge: 60 * 60 // a reasonable expiration date
	}); // example with cookie

	// redirect to authorization url
	redirect(authUrl);
};
```

Alternatively, you can embed the url from `getAuthorizationUrl()` inside an anchor tag. However, keep in mind while sending the result of `getAuthorizationUrl()` to the client is fine, **the provider oauth instance (`providerAuth`) should only be inside a server context**.

```svelte
<a href={providerAuthorizationUrl}>Sign in with provider</a>
```

Make sure to store the `state` to the user/browser so it can be used to validate callbacks from the OAuth provider (preferably as httpOnly cookie).

## Handle callback

On sign in, the provider will redirect the user to your callback url. On callback (GET), get the OAuth `code` and `state` from the request url. Validate that the `state` is the same as the one stored and pass the `code` to `validateCallback()`. This method will return some data about the authenticated user. `existingUser` is the existing user in your database (`null` for first time users), `providerUser` is the user info from the provider, and `createUser()` can be used to create a new user if an existing user does not exist.

The following is semi-pseudo-code (namely the provider part):

```ts
// SERVER
import provider from "@lucia-auth/oauth/provider";
import { auth } from "./lucia.js";

const providerAuth = provider(auth, configs);

// handle GET requests
export const handleGetRequests = async (request: Request) => {
	// get code and state params from url
	const url = new URL(request.url);
	const code = url.searchParams.get("code"); // http://localhost:3000/api/google?code=abc&state=efg => abc
	const state = url.searchParams.get("state"); // http://localhost:3000/api/google?code=abc&state=efg => efg

	// get stored state from cookies
	const storedState = request.headers.cookie.get("state");

	// validate state
	if (state !== storedState) throw new Error(); // invalid state

	const { existingUser, providerUser, createUser } = await providerAuth.validateCallback(code);
	const user =
		existingUser ||
		(await createUser({
			username: providerUser.username // attributes
		})); // create a new user if the user does not exist
	const session = await auth.createSession(user.userId);
	setSessionCookie(session); // store session cookie
};
```
