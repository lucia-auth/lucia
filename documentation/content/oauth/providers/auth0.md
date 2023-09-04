---
title: "Auth0"
description: "Learn how to use the Auth0 OAuth provider"
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
	}
) => Auth0Provider;
```

##### Parameters

Scopes `openid` and `profile` are always included

| name                  | type                                       | description                   | optional |
| --------------------- | ------------------------------------------ | ----------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                |          |
| `config.appDomain`    | `string`                                   | Auth0 OAuth app domain        |          |
| `config.clientId`     | `string`                                   | Auth0 OAuth app client id     |          |
| `config.clientSecret` | `string`                                   | Auth0 OAuth app client secret |          |
| `config.redirectUri`  | `string`                                   | Auth0 OAuth app redirect uri  |          |
| `config.scope`        | `string[]`                                 | an array of scopes            |    ✓     |

##### Returns

| type                              | description    |
| --------------------------------- | -------------- |
| [`Auth0Provider`](#auth0provider) | Auth0 provider |

## Interfaces

### `Auth0Auth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<Auth0Auth<_Auth>>
interface Auth0Auth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<Auth0UserAuth<_Auth>>;
}
```

| type                              |
| --------------------------------- |
| [`Auth0UserAuth`](#auth0userauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

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

### `Auth0UserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	auth0User: Auth0User;
	auth0Tokens: Auth0Tokens;
}
```

| properties    | type                          | description       |
| ------------- | ----------------------------- | ----------------- |
| `auth0User`   | [`Auth0User`](#auth0user)     | Auth0 user        |
| `auth0Tokens` | [`Auth0Tokens`](#auth0tokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
