---
order: 0
title: "Auth0"
description: "Learn about using the Auth0 provider in Lucia OAuth integration"
---

OAuth integration for Auth0. Refer to [Auth0 OAuth documentation](https://auth0.com/docs/get-started/authentication-and-authorization-flow/add-login-auth-code-flow) for getting the required credentials. Provider id is `auth0`.

```ts
import { auth0 } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const auth0Auth = auth0(auth, config);
```

## `auth0()`

```ts
const auth0: (
	auth: Auth,
	config: {
		appDomain: string;
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		connection?: string;
		organization?: string;
		invitation?: string;
		loginHint?: string;
	}
) => Auth0Provider;
```

##### Parameters

| name                  | type                                       | description                                                     | optional |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                                  |          |
| `config.appDomain`    | `string`                                   | Auth0 OAuth app domain                                          |          |
| `config.clientId`     | `string`                                   | Auth0 OAuth app client id                                       |          |
| `config.clientSecret` | `string`                                   | Auth0 OAuth app client secret                                   |          |
| `config.redirectUri`  | `string`                                   | Auth0 OAuth app redirect uri                                    |          |
| `config.scope`        | `string[]`                                 | an array of scopes - `openid` and `profile` is always included  |    ✓     |
| `config.connection`   | `string[]`                                 | Forces the user to sign in with a specific connection           |    ✓     |
| `config.organization` | `string[]`                                 | ID of the organization to use when authenticating a user        |    ✓     |
| `config.invitation`   | `string[]`                                 | Ticket ID of the organization invitation                        |    ✓     |
| `config.loginHint`    | `string[]`                                 | Populates the username/email field for the login or signup page |    ✓     |

##### Returns

| type                              | description    |
| --------------------------------- | -------------- |
| [`Auth0Provider`](#auth0provider) | Auth0 provider |

## Interfaces

### `Auth0Provider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

#### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
```

##### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

#### `validateCallback()`

Validates the callback code.

```ts
const validateCallback: (code: string) => Promise<Auth0UserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                              |
| --------------------------------- |
| [`Auth0UserAuth`](#auth0userauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `Auth0UserAuth`

```ts
type Auth0UserAuth = ProviderUserAuth & {
	auth0User: Auth0User;
	auth0Tokens: Auth0Tokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`Auth0User`](#auth0user)                                          |
| [`Auth0Tokens`](#auth0tokens)                                      |

```ts
import type { Auth0Tokens, Auth0User } from "@lucia-auth/oauth/providers";
```

### `Auth0Tokens`

```ts
type Auth0Tokens = {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	tokenType: string;
};
```

### `Auth0User`

```ts
type Auth0User = {
	id: string;
	nickname: string;
	name: string;
	picture: string;
	updated_at: string;
};
```
