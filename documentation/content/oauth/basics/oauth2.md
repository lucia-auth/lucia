---
title: "OAuth 2.0"
description: "Learn how to implement OAuth 2.0"
---

This page covers OAuth 2.0 authorization code grant type. For OAuth 2.0 providers with PKCE, see [OAuth 2.0 with PKCE](/oauth/basics/oauth2-pkce).

Examples shown here uses GitHub OAuth but the API and overall process is nearly across providers. See each provider's documentation (from the sidebar) for specifics.

## Built-in providers

Initialize the handler using the Lucia `Auth` instance and provider-specific config. This creates a new [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth) extended instance (e.g. `GithubAuth`).

```ts
import { lucia } from "lucia";
import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia();

export const githubAuth = github(auth, config);
```

### Get authorization url

You can get a new authorization url with `getAuthorizationUrl()`. It will return a url and a state. The state is usually defined but it may be undefined if the provider does not support it. If defined, store it in a cookie.

```ts
import { auth, githubAuth } from "$lib/lucia.js";

// get url to redirect the user to, with the state
const [url, state] = await githubAuth.getAuthorizationUrl();

setCookie("github_oauth_state", state, {
	path: "/",
	httpOnly: true, // only readable in the server
	secure: false, // set to `true` in production (HTTPS)
	maxAge: 60 * 60 // a reasonable expiration date
});

// redirect to authorization url
redirect(url);
```

You can set additional query params to the authorization url can be done by using `URL.searchParams.set()` on the returned `URL` instance.

```ts
url.searchParams.set("response_mode", "query");
```

### Validate callback

Upon authentication, the provider will redirect the user back to your application (GET request). The url includes a code, and a state if the provider supports it. If a state is used, make sure to check if the state in the query params is the same as the one stored as a cookie.

Validate the code using `validateCallback()`. If the code is valid, this will return a new [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) among provider specific items (such as provider user data and access tokens). See [Handle users with OAuth](/oauth/basics/handle-users) for how to use it.

```ts
import { auth, githubAuth } from "$lib/lucia.js";

const code = requestUrl.searchParams.get("code");
const state = requestUrl.searchParams.get("state");

// get state cookie we set when we got the authorization url
const stateCookie = getCookie("github_oauth_state");

// validate state
if (!state || !storedState || state !== storedState) throw new Error(); // invalid state

try {
	await githubAuth.validateCallback(code);
} catch {
	// invalid code
}
```

## OAuth helpers

If your provider isn't support by the integration, you can use the included OAuth helpers. The basic process is basically the same except for `OAuth2ProviderAuth.getAuthorizationUrl()` and `OAuth2ProviderAuth.validateCallback()`.

## Create authorization URL

You can create a new authorization url with a state with [`createOAuth2AuthorizationUrl()`](/reference/oauth/modules/main#createoauth2authorizationurl). This take the base authorization url, and returns the full url as the first item and an OAuth state as the second.

The state should be stored as a http-only cookie if your provider supports it.

```ts
import { createAuthorizationUrl } from "@lucia-auth/oauth";

// get url to redirect the user to, with the state
const [url, state] = await createAuthorizationUrl(
	"https://github.com/login/oauth/authorize",
	{
		clientId,
		scope: ["user:email"], // empty array if none
		redirectUri
	}
);
```

### Additional configuration

You can set additional query params to the authorization url can be done by using `URL.searchParams.set()` on the returned `URL` instance.

```ts
url.searchParams.set("response_mode", "query");
```

## Validate authorization code

Extract the authorization code from the query string and verify it using [`validateOAuth2AuthorizationCode()`](/reference/oauth/modules/main#validateoauth2authorizationcode). This sends a request to the provided url and returns the JSON-parsed response body, which includes the access token. You can define the return type by passing a generic. This will throw a [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror) if the request fails.

```ts
import { validateOAuth2AuthorizationCode } from "@lucia-auth/oauth";

type AccessTokenResult = {
	access_token: string;
};

const tokens = await validateOAuth2AuthorizationCode<AccessTokenResult>(
	code,
	"https://github.com/login/oauth/access_token",
	{
		clientId,
		clientPassword: {
			clientSecret,
			authenticateWith: "client_secret"
		},
		redirectUri // optional
	}
);
const accessToken = tokens.access_token;
```

### Client password

If your provider takes a client password, there are 2 ways to verify the code. You can either sending the client secret in the body, or using the HTTP basic authentication scheme. This depends on the provider.

#### Send client secret in the body

Set `clientPassword.authenticateWith` to `"client_secret"` to send the client secret in the request body.

```ts
const tokens = await validateOAuth2AuthorizationCode<Result>(code, url, {
	clientId,
	clientPassword: {
		clientSecret,
		authenticateWith: "client_secret"
	}
});
```

#### Use HTTP basic authentication

You can send the base64 encoded client id and secret by setting `clientPassword.authenticateWith` to `"http_basic_auth"`.

```ts
const tokens = await validateOAuth2AuthorizationCode<Result>(code, url, {
	clientId,
	clientPassword: {
		clientSecret,
		authenticateWith: "http_basic_auth"
	}
});
```

## Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces/oauthrequesterror), which includes a request and response object.

```ts
import { OAuthRequestError } from "@lucia-auth/oauth";

try {
	await githubAuth.validateCallback(code);
} catch (e) {
	if (e instanceof OAuthRequestError) {
		const { request, response } = e;
	}
}
```
