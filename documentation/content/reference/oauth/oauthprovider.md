---
title: "`OAuthProvider`"
_order: 1
---

```ts
type OAuthProvider = {
	getAuthorizationUrl: () => Promise<readonly [URL, ...any[]]>;
	validateCallback: (code: string, ...args: any[]) => Promise<ProviderSession>;
};
```

## `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage.

```ts
const getAuthorizationUrl: (
	redirectUri?: string
) => Promise<[url: URL, state: string]>;
```

#### Parameter

| name        | type     | description                | optional |
| ----------- | -------- | -------------------------- | :------: |
| redirectUri | `string` | an authorized redirect URI |    ✓     |

#### Returns

Refer to each provider's page for specifics.

| name    | type     | description             |
| ------- | -------- | ----------------------- |
| `url`   | `URL`    | authorize url           |
| `state` | `string` | state to store (cookie) |

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
