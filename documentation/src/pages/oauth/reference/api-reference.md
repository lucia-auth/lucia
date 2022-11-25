---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "API reference"
---

Please refer to the provider's page for provider-specific documentation.

## `OAuthProvider`

```ts
interface OAuthProvider {
	getAuthorizationUrl: (state?: string | null) => [url: string, state: string | undefined];
	validateCallback: (code: string) => Promise<ProviderSession>;
}
```

### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. If a state was passed in, it will be added as a query parameter in the authorization url. If left empty, a state will be generated. If set to `null`, the `state will be left out of the authorization url. If a state was added to the authorization url, it will be included as the second element of the return tuple.

```ts
const getAuthorizationUrl: <State = string | null | undefined = undefined>(state?: State) => State extends null ? [url: string] : [url: string, state: string]
```

#### Parameter

| name  | type     | description                                                                           | optional |
| ----- | -------- | ------------------------------------------------------------------------------------- | -------- |
| state | `string` | an opaque value used by the client to maintain state between the request and callback | true     |

#### Returns

| type                          | description                            |
| ----------------------------- | -------------------------------------- |
| `[url: string]`               | if arg `state` is left out or `string` |
| `[url: string, state: string] | if arg `state` is `null`               |

### `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (code: string) => Promise<ProviderSession>;
```

#### Parameter

| name | type     | description                                                |
| ---- | -------- | ---------------------------------------------------------- |
| code | `string` | authorization code from callback - refer to provider's doc |

#### Returns

| type                                                                | description       |
| ------------------------------------------------------------------- | ----------------- |
| [`ProviderSession`](/oauth/reference/api-reference#providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

## `ProviderSession`

```ts
interface ProviderSession {
	existingUser: User | null;
	createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
	providerUser: Record<string, any>;
	[data: string]: any;
}
```

| name                                                    | type                                                  | description                                                    |
| ------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| existingUser                                            | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user)              |
| [createUser](/oauth/reference/api-reference#createuser) | `Function`                                            |                                                                |
| providerUser                                            | `Record<string, any>`                                 | user info from the used provider - refer to the provider's doc |
| [data: string]                                          | `any`                                                 | refer to the provider's doc                                    |

### `createUser()`

Creates a new user for the authorized session by calling [Lucia.createUser()](/reference/api/server-api#createuser) using the provided user attributes. Refer to the provider's doc for the provider and identifier used.

```ts
const createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
```

#### Parameter

| name           | type                                                                      | description                                 | optional |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------- | -------- |
| userAttributes | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes) | additional user data to store in user table | true     |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | the newly created user |

#### Errors

Refer to [Lucia.createUser()](/reference/api/server-api#createuser)
