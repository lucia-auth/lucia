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

### `TwitterProvider`

Satisfies [`OAuthProvider`](/reference/oauth/oauthprovider).

#### `getAuthorizationUrl()`

Returns the authorization url for user redirection, a state and PKCE code verifier. The state and code verifier should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: () => Promise<
	[url: URL, codeVerifier: string, state: string]
>;
```

##### Returns

| name           | type     | description          |
| -------------- | -------- | -------------------- |
| `url`          | `URL`    | authorization url    |
| `codeVerifier` | `string` | PKCE code verifier   |
| `state`        | `string` | state parameter used |

#### `validateCallback()`

Validates the callback code. Requires the PKCE code verifier generated with `getAuthorizationUrl()`.

```ts
const validateCallback: (
	code: string,
	codeVerifier: string
) => Promise<ProviderSession>;
```

##### Parameter

| name           | type     | description                                               |
| -------------- | -------- | --------------------------------------------------------- |
| `code`         | `string` | authorization code from callback                          |
| `codeVerifier` | `string` | PKCE code verifier generated with `getAuthorizationUrl()` |

##### Returns

| type                                  |
| ------------------------------------- |
| [`TwitterUserAuth`](#twitteruserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `TwitterUserAuth`

```ts
type TwitterUserAuth = ProviderUserAuth & {
	twitterUser: TwitterUser;
	twitterTokens: TwitterTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`twitterUser`](#twitteruser)                                      |
| [`twitterTokens`](#twittertokens)                                  |

### `TwitterTokens`

```ts
type TwitterTokens = {
	accessToken: string;
	accessTokenExpiresIn: string;
	refreshToken: string;
};
```

## `TwitterUser`

```ts
type TwitterUser = {
	id: string;
	name: string;
	username: string;
};
```
