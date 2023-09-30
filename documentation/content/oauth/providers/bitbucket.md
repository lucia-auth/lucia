---
title: "Bitbucket OAuth provider"
description: "Learn how to use the Bitbucket OAuth provider"
---

OAuth integration for Bitbucket. Provider id is `bitbucket`.

**Make sure you enable scope `account` in your Bitbucket app settings.**

```ts
import { bitbucket } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const bitbucketAuth = bitbucket(auth, configs);
```

## `bitbucket()`

Scopes can only be configured from your Bitbucket app settings.

```ts
const bitbucket: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
	}
) => BitbucketProvider;
```

##### Parameters

| name                  | type                                       | description                       |
| --------------------- | ------------------------------------------ | --------------------------------- |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                    |
| `config.clientId`     | `string`                                   | Bitbucket OAuth app client id     |
| `config.clientSecret` | `string`                                   | Bitbucket OAuth app client secret |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI        |

##### Returns

| type                                      | description        |
| ----------------------------------------- | ------------------ |
| [`BitbucketProvider`](#bitbucketprovider) | Bitbucket provider |

## Interfaces

### `BitbucketAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<BitbucketAuth<_Auth>>
interface BitbucketAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<BitbucketUserAuth<_Auth>>;
}
```

| type                                      |
| ----------------------------------------- |
| [`BitbucketUserAuth`](#bitbucketuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `BitbucketTokens`

```ts
type BitbucketTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
};
```

### `BitbucketUser`

```ts
type BitbucketUser = {
	type: string;
	links: {
		avatar:
			| {}
			| {
					href: string;
					name: string;
			  };
	};
	created_on: string;
	display_name: string;
	username: string;
	uuid: string;
};
```

### `BitbucketUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface BitbucketUserAuth<_Auth extends Auth>
	extends ProviderUserAuth<_Auth> {
	bitbucketUser: BitbucketUser;
	bitbucketTokens: BitbucketTokens;
}
```

| properties        | type                                  | description       |
| ----------------- | ------------------------------------- | ----------------- |
| `bitbucketUser`   | [`BitbucketUser`](#bitbucketuser)     | Bitbucket user    |
| `bitbucketTokens` | [`BitbucketTokens`](#bitbuckettokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
