---
_order: 0
title: "Facebook"
description: "Learn about using the Facebook provider in Lucia OAuth integration"
---

OAuth integration for Facebook. Refer to step 1 of [Facebook Login documentation](https://developers.facebook.com/docs/facebook-login/web) for getting the required credentials. Provider id is `facebook`.

```ts
import { facebook } from "@lucia-auth/oauth/providers";
```

The `identity` scope is always included regardless of provided `scope` config.

### Initialization

```ts
import { facebook } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const facebookAuth = facebook(auth, config);
```

```ts
const facebook: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => OAuthProvider<FacebookUser, FacebookTokens>;
```

#### Parameter

| name                | type                                 | description                                        | optional |
| ------------------- | ------------------------------------ | -------------------------------------------------- | :------: |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                     |          |
| config.clientId     | `string`                             | Facebook OAuth app client id                       |          |
| config.clientSecret | `string`                             | Facebook OAuth app client secret                   |          |
| configs.redirectUri | `string`                             | an authorized redirect URI                         |          |
| config.scope        | `string[]`                           | an array of scopes - `identity` is always included |    ✓     |

#### Returns

| type                                              | description       |
| ------------------------------------------------- | ----------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Facebook provider |

## `FacebookProvider`

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

## `FacebookTokens`

```ts
type FacebookTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

## `FacebookUser`

```ts
type FacebookUser = {
	id: string;
	name: string;
	picture: string;
};
```
