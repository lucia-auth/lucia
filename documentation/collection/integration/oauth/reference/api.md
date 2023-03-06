---
_order: 1
title: "API"
---

These can be imported from `@lucia-auth/oauth`.

```ts
import type { provider } from "@lucia-auth/oauth";
```

## `generateState`

Generates a cryptographically random string for state.

```ts
const generateState: () => string;
```

#### Returns

| type     | description |
| -------- | ----------- |
| `string` | state       |

## `LuciaOAuthRequestError`

Error thrown if a request to a provider failed.

```ts
class LuciaOAuthRequestError extends Error {
    status: number,
    body: Record<string, any> | null
    message: "REQUEST_FAILED"
}
```

#### Properties

| name    | type                          | description                                        |
| ------- | ----------------------------- | -------------------------------------------------- |
| status  | `number`                      | response status                                    |
| body    | `Record<string, any> \| null` | JSON parsed response body, `null` if parsing fails |
| message | `string`                      | error message                                      |

## `provider`

Creates a new [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider). If you're creating your own provider, take a look at [Lucia's repository](https://github.com/pilcrowOnPaper/lucia/tree/main/packages/integration-oauth/src/providers/index.js) for examples.

```ts
const provider = (
	auth: Auth,
	config: {
		providerId: string;
		getAuthorizationUrl: (state: string) => Promise<URL>;
		getTokens: (code: string) => Promise<{
			accessToken: string;
		}>;
		getProviderUser: (
			accessToken: string
		) => Promise<readonly [providerUserId: string, providerUser: {}]>;
	}
) => OAuthProvider;
```

#### `Parameter`

| name                       | type                                          | description                        |
| -------------------------- | --------------------------------------------- | ---------------------------------- |
| auth                       | [`Auth`](/reference/modules/lucia-auth#lucia) |                                    |
| config.providerId          | `string`                                      | Unique identifier for the provider |
| config.getAuthorizationUrl | `Function`                                    |                                    |
| config.getTokens           | `Function`                                    |                                    |
| config.getProviderUser     | `Function`                                    |                                    |

#### `Returns`

| type                                                           |
| -------------------------------------------------------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) |

### `config.getAuthorizationUrl`

Generates an authorization url using the provided state.

```ts
const getAuthorizationUrl: (state: string) => Promise<URL>;
```

#### `Parameter`

| name  | type     | description     |
| ----- | -------- | --------------- |
| state | `string` | state parameter |

#### `Returns`

| type  | description       |
| ----- | ----------------- |
| `URL` | authorization url |

### `config.getTokens`

Validates the provided callback code and retrieves an access token. Can return any object but must include `accessToken`.

```ts
const getAuthorizationUrl: (code: string) => Promise<{
	accessToken: string;
}>;
```

#### `Parameter`

| name | type     | description               |
| ---- | -------- | ------------------------- |
| code | `string` | callback code to validate |

#### `Returns`

| name        | type     | description  |
| ----------- | -------- | ------------ |
| accessToken | `string` | access token |

### `config.getProviderUser`

Retrieves the current user from the provider using the provided provider access token.

```ts
const getProviderUser: (accessToken: string) => Promise<[
    providerUserId: string,
	providerUser: Record<string, any>;
]>;
```

#### `Parameter`

| name        | type     | description           |
| ----------- | -------- | --------------------- |
| accessToken | `string` | provider access token |

#### `Returns`

| name           | type                   | description                |
| -------------- | ---------------------- | -------------------------- |
| providerUserId | `string`               | provider user id for Lucia |
| providerUser   | ` Record<string, any>` | user object from provider  |
