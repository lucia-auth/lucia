---
_order: 0
title: "Getting started"
description: "Learn about getting started with the OAuth integration for Lucia in Astro"
---

While Lucia doesn't directly support OAuth, we provide an external library that handles OAuth using Lucia. This is a server-only module.

Supported providers are listed on the left. You can also add your own providers with [`provider()`](/reference/oauth/lucia-auth-oauth#provider) as well.

## Installation

```
npm i @lucia-auth/oauth
pnpm add @lucia-auth/oauth
yarn add @lucia-auth/oauth
```

This page will use Github OAuth but the API and auth flow is nearly identical between providers.

## Initialize OAuth handler

Initialize the handler using the Lucia `Auth` instance and provider-specific config. This page will use Github OAuth but the auth flow is the same across providers. Refer to each provider's documentation for the specifics.

```ts
// lib/lucia.ts
import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

export const githubAuth = github(auth, config);
```

## Sign in with the provider

When a user clicks "Sign in with <provider>", redirect the user to a GET endpoint. This endpoint will redirect the user to the provider's sign in page. On request, store the [state](https://www.rfc-editor.org/rfc/rfc6749#section-4.1.1) inside a http0nly cookie and redirect the user to the provider's authorization url. Both, the authorization url and state can be retrieved with `getAuthorizationUrl()`.

The state may not be returned depending on the provider, and it may return PKCE code verifier as well. Please check each provider's page (see left/menu).

```ts
// src/pages/api/oauth/index.ts
import { githubAuth } from "../../../lib/lucia";

import type { APIRoute } from "astro";

export const get: APIRoute = async ({ url, cookies }) => {
	// get url to redirect the user to, with the state
	const [url, state] = await githubAuth.getAuthorizationUrl();
	// the state can be stored in cookies or localstorage for request validation on callback
	cookies.set("oauth_state", state, {
		path: "/",
		maxAge: 60 * 60,
		httpOnly: true,
		secure: import.meta.env.PROD
	});
	return new Response(null, {
		status: 302,
		headers: {
			location: url.toString()
		}
	});
};
```

Alternatively, you can embed the url from `getAuthorizationUrl()` inside an anchor tag.

```svelte
<a href={providerAuthorizationUrl}>Sign in with provider</a>
```

> (red) Keep in mind while sending the result of `getAuthorizationUrl()` to the client is fine, **the provider oauth instance (`providerAuth`) should only be inside a server context**. You will leak your API keys if you import it in the client.

## Handle callback

On sign in, the provider will redirect the user to your callback url. On callback (GET), get the OAuth `code` and `state` from the request url. Validate that the `state` is the same as the one stored and pass the `code` to `validateCallback()`. This method will return some data about the authenticated user. `existingUser` is the existing user in your database (`null` for first time users) and `providerUser` is the user info from the provider.

### Authenticate user

`createUser()` method can be used to create a new user if an existing user does not exist.

```ts
// src/pages/api/oauth/github.ts
import { auth, githubAuth } from "../../../lib/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const authRequest = auth.handleRequest(context);
	// get code and state params from url
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	// get stored state from cookies
	const storedState = context.cookies.get("oauth_state").value;
	// validate state
	if (!storedState || storedState !== state || !code || !state) {
		return new Response(null, { status: 401 });
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);
		const getUser = async () => {
			if (existingUser) return existingUser;
			// create a new user if the user does not exist
			return await createUser({
				// attributes
				username: providerUser.login
			});
		};
		const user = await getUser();
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch {
		// invalid code
		return new Response(null, {
			status: 500
		});
	}
};
```

> (red) **There's no guarantee that the user's email provided by the provider is verified!** Make sure to check with each provider's documentation if you're working with email. This is super important if you're planning to link accounts.

### Add provider to existing user

Alternatively, you may want to add a new provider (sign in method) to the user by creating a new key for the user. Calling [`createPersistentKey()`](/reference/oauth/providersession#createpersistentkey) will create a new persistent key linked to the provided user id.

```ts
const { existingUser, createPersistentKey } = await githubAuth.validateCallback(
	code
);
if (!existingUser) {
	await createPersistentKey(currentUser.userId);
}
```
