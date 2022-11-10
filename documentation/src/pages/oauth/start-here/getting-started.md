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

When a user clicks "Sign in with [provider]", redirect the user to the provider's authorization url. This will send the user to the provider's sign in page. This authorization url can be retrieved with `getAuthorizationUrl()`.

```ts
import provider from "@lucia-auth/oauth/provider";
import { auth } from "./lucia.js";

const providerAuth = provider(auth, configs);

// redirect to authorization url
new Response(null, {
	status: 302,
	headers: {
		location: providerAuth.getAuthorizationUrl()
	}
});
```

Alternatively, you can embed the url from `getAuthorizationUrl()` inside an anchor tag. However, keep in mind while sending the result of `getAuthorizationUrl()` to the client is fine, **the provider oauth instance (`providerAuth`) should only be inside a server context**.

```svelte
<a href={providerAuthorizationUrl}>Sign in with provider</a>
```

## Handle callback

On sign in, the provider will redirect the user to your callback url. On callback (GET), get the OAuth code from the request and use that to validate the request using `validateCallback()`. This method will return some data about the authenticated user. This differs from the used provider, but some are always provided: `existingUser` is the existing user in your database (`null` for first time users), `providerUser` is the user info from the provider, and `createUser()` can be used to create a new user if an existing user does not exist.

The following is semi-pseudo-code (namely the provider part):

```ts
import provider from "@lucia-auth/oauth/provider";
import { auth } from "./lucia.js";

const providerAuth = provider(auth, configs);

// handle GET requests
export const get = async (request: Request) => {
	const { existingUser, providerUser, createUser } = await providerAuth.validateCallback(code);
	const user =
		existingUser ||
		(await createUser({
			username: providerUser.username // attributes
		})); // create a new user if the user does not exist
	const session = await auth.createSession(user.userId);
	const serializedCookies = auth.createSessionCookies(session);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/",
			"set-cookie": serializedCookies.toString()
		}
	});
};
```
