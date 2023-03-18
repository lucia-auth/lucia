---
title: "OAuthProvider"
_order: 1
---

```ts
type OAuthProvider<ProviderUser, ProviderTokens> = {
	getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
	validateCallback: (
		code: string
	) => Promise<ProviderSession<ProviderUser, ProviderTokens>>;
};
```

## `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. This should generate and use a state using [`generateState()`](/reference/oauth/lucia-auth-oauth#generatestate).

```ts
const getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
```

#### Parameter

| name  | type     | description                                                                           | optional |
| ----- | -------- | ------------------------------------------------------------------------------------- | -------- |
| state | `string` | an opaque value used by the client to maintain state between the request and callback | true     |

#### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

## `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (
	code: string
) => Promise<ProviderSession<ProviderUser, ProviderTokens>>;
```

#### Parameter

| name | type     | description                                                |
| ---- | -------- | ---------------------------------------------------------- |
| code | `string` | authorization code from callback - refer to provider's doc |

#### Returns

| type                                                  | description       |
| ----------------------------------------------------- | ----------------- |
| [`ProviderSession`](/reference/oauth/providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |
