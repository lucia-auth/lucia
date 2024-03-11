---
title: "Custom OAuth 2.0 providers"
---

# Custom OAuth 2.0 providers

If you're looking to implement OAuth 2.0 for a provider that Arctic doesn't support, we recommend using Oslo's [`OAuth2Client`](https://oslo.js.org/reference/oauth2/OAuth2Client).

## Initialization

Pass your client ID and the provider's authorization and token endpoint to initialize the client. You can optionally pass the redirect URI.

```ts
import { OAuth2Client } from "oslo/oauth2";

const authorizeEndpoint = "https://github.com/login/oauth/authorize";
const tokenEndpoint = "https://github.com/login/oauth/access_token";

const oauth2Client = new OAuth2Client(clientId, authorizeEndpoint, tokenEndpoint, {
	redirectURI: "http://localhost:3000/login/github/callback"
});
```

## Create authorization URL

Create an authorization URL with [`OAuth2Client.createAuthorizationURL()`](https://oslo.js.org/reference/oauth2/OAuth2Client/createAuthorizationURL). This optionally accepts a `state`, `codeVerifier` for PKCE flows, and `scopes`.

```ts
import { generateState, generateCodeVerifier } from "oslo/oauth2";

const state = generateState();
const codeVerifier = generateCodeVerifier(); // for PKCE flow

const url = await oauth2Client.createAuthorizationURL({
	state,
	scopes: ["user:email"],
	codeVerifier
});
```

## Validate authorization callback

Use [`OAuth2Client.validateAuthorizationCode()`](https://oslo.js.org/reference/oauth2/OAuth2Client/validateAuthorizationCode) to validate authorization codes. By default, it sends the client secret, if provided, using the HTTP basic auth scheme. To send it inside the request body (i.e. search params), set the `authenticateWith` option to `"request_body"`.

This throws an [`OAuth2RequestError`](https://oslo.js.org/reference/oauth2/OAuth2RequestError) on error responses.

You can add additional response JSON fields by passing a type.

```ts
try {
	const { accessToken, refreshToken } = await oauth2Client.validateAuthorizationCode<{
		refreshToken: string;
	}>(code, {
		credentials: clientSecret,
		authenticateWith: "request_body"
	});
} catch (e) {
	if (e instanceof OAuth2RequestError) {
		// see https://www.rfc-editor.org/rfc/rfc6749#section-5.2
		const { request, message, description } = e;
	}
	// unknown error
}
```

For PKCE flow, pass the `codeVerifier` as an option.

```ts
await oauth2Client.validateAuthorizationCode<{
	refreshToken: string;
}>(code, {
	credentials: clientSecret,
	codeVerifier
});
```

## Refresh access tokens

Use [`OAuth2Client.refreshAccessToken()`](https://oslo.js.org/reference/oauth2/OAuth2Client/refreshAccessToken) to refresh an access token. The API is similar to `validateAuthorizationCode()` and it also throws an `OAuth2RequestError` on error responses.

```ts
try {
	const { accessToken, refreshToken } = await oauth2Client.refreshAccessToken<{
		refreshToken: string;
	}>(code, {
		credentials: clientSecret,
		authenticateWith: "request_body"
	});
} catch (e) {
	if (e instanceof OAuth2RequestError) {
		// see https://www.rfc-editor.org/rfc/rfc6749#section-5.2
		const { request, message, description } = e;
	}
	// unknown error
}
```
