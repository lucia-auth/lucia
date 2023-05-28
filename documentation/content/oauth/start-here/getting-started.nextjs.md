---
_order: 0
title: "Getting started"
description: "Learn about getting started with the OAuth integration for Lucia in Next.js"
---

While Lucia doesn't directly support OAuth, we provide an external library that handles OAuth using Lucia. This is a server-only module.

Supported providers are listed on the left. You can also add your own providers with [`provider()`](/reference/oauth/lucia-auth-oauth#provider) as well.

This guide uses the `pages` router but the code example for the App router version is shown at the end.

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
// auth/lucia.ts
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
// pages/api/oauth
import { githubAuth } from "../../../auth/lucia";
import cookie from "cookie";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET" || !req.url) return res.status(404).end();
	if (!req.url) return res.status(400);

	// get url to redirect the user to, with the state
	const [url, state] = await githubAuth.getAuthorizationUrl();

	// the state can be stored in cookies or localstorage for request validation on callback
	const oauthStateCookie = cookie.serialize("oauth_state", state, {
		path: "/",
		maxAge: 60 * 60,
		httpOnly: true,
		secure: false // true on prod
	});

	// redirect to authorization url
	return res
		.status(302)
		.setHeader("set-cookie", oauthStateCookie)
		.redirect(url.toString());
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
// pages/api/oauth/github.ts
import { auth, githubAuth } from "../../../auth/lucia";
import cookie from "cookie";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET" || !req.url) return res.status(404).end();
	const authRequest = auth.handleRequest({ req, res });
	// get code and state params from url
	const code = req.query.code;
	const state = req.query.state;
	// get stored state from cookies
	const { oauth_state: storedState } = cookie.parse(req.headers.cookie || "");
	// validate state
	if (
		typeof code !== "string" ||
		typeof code !== "string" ||
		!storedState ||
		!state ||
		storedState !== state
	) {
		return res.status(400).end();
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
		return res.status(302).redirect("/");
	} catch {
		// invalid code
		return res.status(500).end();
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

## App router

### Get authorization url

```ts
// app/api/oauth/routes.ts
import { githubAuth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	cookies().set("oauth_state", state, {
		path: "/",
		maxAge: 60 * 60,
		httpOnly: true,
		secure: false // true on prod
	});
	return NextResponse.redirect(url.toString());
};
```

### Validate callback

```ts
// app/api/oauth/github/routes.ts
import { auth, githubAuth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies().get("oauth_state")?.value ?? null;
	if (!storedState || storedState !== state || !code || !state) {
		return new Response(null, { status: 401 });
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			if (existingUser) return existingUser;
			return await createUser({
				username: providerUser.login
			});
		};
		const user = await getUser();
		const session = await auth.createSession(user.userId);
		const authRequest = auth.handleRequest({ request, cookies });
		authRequest.setSession(session);
		return NextResponse.redirect(new URL("/", url));
	} catch (e) {
		return new Response(null, {
			status: 500
		});
	}
};
```
