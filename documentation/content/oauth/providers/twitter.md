---
title: "Twitter"
description: "Learn how to use the Twitter OAuth provider"
---

OAuth integration for Twitter OAuth 2.0 with PKCE. The access token can only be used for Twitter API v2. Provider id is `twitter`.

```ts
import { twitter } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const twitterAuth = twitter(auth, config);
```

## `twitter()`

```ts
const twitter: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => TwitterProvider;
```

##### Parameter

| name               | type                                       | description                             | optional |
| ------------------ | ------------------------------------------ | --------------------------------------- | :------: |
| auth               | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                          |          |
| config.clientId    | `string`                                   | client id - choose any unique client id |          |
| config.redirectUri | `string`                                   | redirect URI                            |          |
| config.scope       | `string[]`                                 | an array of scopes                      |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`TwitterProvider`](#twitterprovider) | Twitter provider |

## Interfaces

### `TwitterAuth`

See [`OAuth2ProviderAuthWithPKCE`](/reference/oauth/interfaces/oauth2providerauthwithpkce).

```ts
// implements OAuth2ProviderAuthWithPKCE<TwitterAuth<_Auth>>
interface TwitterAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<
		readonly [url: URL, codeVerifier: string, state: string]
	>;
	validateCallback: (code: string) => Promise<TwitterUserAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`TwitterUserAuth`](#twitteruserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `TwitterTokens`

```ts
type TwitterTokens = {
	accessToken: string;
	refreshToken: string | null;
};
```

### `TwitterUser`

```ts
type TwitterUser = {
	id: string;
	name: string;
	username: string;
};
```

### `TwitterUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	twitterUser: TwitterUser;
	twitterTokens: TwitterTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `twitterUser`   | [`TwitterUser`](#twitteruser)     | Twitter user      |
| `twitterTokens` | [`TwitterTokens`](#twittertokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
