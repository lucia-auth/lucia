---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "API reference"
---

Please refer to the provider's page for provider-specific documentation.

## `OAuthProvider`

```ts
interface OAuthProvider {
	getAuthorizationUrl: () => string;
	validateCallback: (code: string) => Promise<ProviderSession>;
}
```

### `getAuthorizationUrl()`

Returns the authorization url to redirect the user to.

```ts
const getAuthorizationUrl: () => string;
```

#### Returns

| type     | description           |
| -------- | --------------------- |
| `string` | The authorization url |

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
| [`ProviderSession`](/oauth/reference/api-reference#providersession) | The oauth session |

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
| userAttributes | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes) | Additional user data to store in user table | true     |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | the newly created user |

#### Errors

Refer to [Lucia.createUser()](/reference/api/server-api#createuser)
