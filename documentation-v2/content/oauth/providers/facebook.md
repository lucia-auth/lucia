---
order:: 0
title: "Facebook"
description: "Learn about using the Facebook provider in Lucia OAuth integration"
---

OAuth integration for Facebook. Refer to step 1 of [Facebook Login documentation](https://developers.facebook.com/docs/facebook-login/web) for getting the required credentials. Provider id is `facebook`.

```ts
import { facebook } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const facebookAuth = facebook(auth, config);
```

The `identity` scope is always included regardless of provided `scope` config.

## `facebook()`

```ts
const facebook: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => FacebookProvider;
```

##### Parameters

| name                  | type                                       | description                                        | optional |
| --------------------- | ------------------------------------------ | -------------------------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                     |          |
| `config.clientId`     | `string`                                   | Facebook OAuth app client id                       |          |
| `config.clientSecret` | `string`                                   | Facebook OAuth app client secret                   |          |
| `configs.redirectUri` | `string`                                   | an authorized redirect URI                         |          |
| `config.scope`        | `string[]`                                 | an array of scopes - `identity` is always included |    ✓     |

##### Returns

| type                                    | description       |
| --------------------------------------- | ----------------- |
| [`FacebookProvider`](#facebookprovider) | Facebook provider |

## Interfaces

### `FacebookProvider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

```ts
type FacebookProvider = OAuthProvider<FacebookUser, FacebookTokens>;
```

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
const validateCallback: (code: string) => Promise<FacebookUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                    |
| --------------------------------------- |
| [`FacebookUserAuth`](#facebookuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `FacebookUserAuth`

```ts
type FacebookUserAuth = ProviderUserAuth & {
	facebookUser: FacebookUser;
	facebookTokens: FacebookTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`FacebookUser`](#facebookuser)                                    |
| [`FacebookTokens`](#facebooktokens)                                |

### `FacebookTokens`

```ts
type FacebookTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

### `FacebookUser`

```ts
type FacebookUser = {
	id: string;
	name: string;
	picture: string;
};
```
