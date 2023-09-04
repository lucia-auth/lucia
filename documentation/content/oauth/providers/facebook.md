---
title: "Facebook"
description: "Learn how to use the Facebook OAuth provider"
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

Scope `identity` is always included.

| name                  | type                                       | description                      | optional |
| --------------------- | ------------------------------------------ | -------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                   |          |
| `config.clientId`     | `string`                                   | Facebook OAuth app client id     |          |
| `config.clientSecret` | `string`                                   | Facebook OAuth app client secret |          |
| `configs.redirectUri` | `string`                                   | an authorized redirect URI       |          |
| `config.scope`        | `string[]`                                 | an array of scopes               |    ✓     |

##### Returns

| type                                    | description       |
| --------------------------------------- | ----------------- |
| [`FacebookProvider`](#facebookprovider) | Facebook provider |

## Interfaces

### `FacebookAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<FacebookAuth<_Auth>>
interface FacebookAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<FacebookUserAuth<_Auth>>;
}
```

| type                                    |
| --------------------------------------- |
| [`FacebookUserAuth`](#facebookuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `FacebookTokens`

```ts
type FacebookTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};
```

### `FacebookUser`

`email` is only included if `email` scope if provided.

```ts
type FacebookUser = {
	id: string;
	name: string;
	email?: string;
	picture: {
		data: {
			height: number;
			is_silhouette: boolean;
			url: string;
			width: number;
		};
	};
};
```

### `FacebookUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	facebookUser: FacebookUser;
	facebookTokens: FacebookTokens;
}
```

| properties       | type                                | description       |
| ---------------- | ----------------------------------- | ----------------- |
| `facebookUser`   | [`FacebookUser`](#facebookuser)     | Facebook user     |
| `facebookTokens` | [`FacebookTokens`](#facebooktokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
