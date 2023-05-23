---
_order: 0
title: "Auth0"
description: "Learn about using the Auth0 provider in Lucia OAuth integration"
---

OAuth integration for Auth0. Refer to [Auth0 OAuth documentation](https://auth0.com/docs/get-started/authentication-and-authorization-flow/add-login-auth-code-flow) for getting the required credentials. Provider id is `auth0`.

```ts
import { auth0 } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { auth0 } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const auth0Auth = auth0(auth, config);
```

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
) => OAuthProvider<Auth0User, Auth0Tokens>;
```

#### Parameter

| name                | type                                 | description                                                     | optional |
| ------------------- | ------------------------------------ | --------------------------------------------------------------- | :------: |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                                  |          |
| config.appDomain    | `string`                             | Auth0 OAuth app domain                                          |          |
| config.clientId     | `string`                             | Auth0 OAuth app client id                                       |          |
| config.clientSecret | `string`                             | Auth0 OAuth app client secret                                   |          |
| config.redirectUri  | `string`                             | Auth0 OAuth app redirect uri                                    |          |
| config.scope        | `string[]`                           | an array of scopes - `openid` and `profile` is always included  |    ✓     |
| config.connection   | `string[]`                           | Forces the user to sign in with a specific connection           |    ✓     |
| config.organization | `string[]`                           | ID of the organization to use when authenticating a user        |    ✓     |
| config.invitation   | `string[]`                           | Ticket ID of the organization invitation                        |    ✓     |
| config.loginHint    | `string[]`                           | Populates the username/email field for the login or signup page |    ✓     |

#### Returns

| type                                              | description    |
| ------------------------------------------------- | -------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Auth0 provider |

## `GithubProvider`

Satisfies [`OAuthProvider`](/reference/oauth/oauthprovider).

### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

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

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

### `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (code: string) => Promise<ProviderSession>;
```

#### Parameter

| name | type     | description                      |
| ---- | -------- | -------------------------------- |
| code | `string` | authorization code from callback |

#### Returns

| type                                                  | description       |
| ----------------------------------------------------- | ----------------- |
| [`ProviderSession`](/reference/oauth/providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

## `Auth0Tokens`

```ts
type Auth0Tokens = {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	tokenType: string;
};
```

## `Auth0User`

```ts
type Auth0User = {
	id: string;
	nickname: string;
	name: string;
	picture: string;
	updated_at: string;
};
```
