---
order:: 0
title: "Lichess"
description: "Learn about using the Lichess provider in Lucia OAuth integration"
---

OAuth integration for Lichess. Provider id is `lichess`.

```ts
import { lichess } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const lichessAuth = lichess(auth, config);
```

## `lichess()`

```ts
const lichess: (
	auth: Auth,
	config: {
		clientId: string;
		redirectUri: string;
		scope?: string[];
	}
) => LichessProvider;
```

##### Parameter

| name               | type                                 | description                             | optional |
| ------------------ | ------------------------------------ | --------------------------------------- | :------: |
| auth               | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                          |          |
| config.clientId    | `string`                             | client id - choose any unique client id |          |
| config.redirectUri | `string`                             | redirect URI                            |          |
| config.scope       | `string[]`                           | an array of scopes                      |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`LichessProvider`](#lichessprovider) | Lichess provider |

## Interfaces

### `LichessProvider`

Satisfies [`LichessProvider`](/reference/oauth/oauthprovider).

#### `getAuthorizationUrl()`

Returns the authorization url for user redirection, a state and PKCE code verifier. The state and code verifier should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: () => Promise<
	[url: URL, state: string, codeVerifier: string]
>;
```

##### Returns

| name           | type     | description          |
| -------------- | -------- | -------------------- |
| `url`          | `URL`    | authorization url    |
| `state`        | `string` | state parameter used |
| `codeVerifier` | `string` | PKCE code verifier   |

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
| [`LichessUserAuth`](#lichessuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `LichessUserAuth`

```ts
type LichessUserAuth = ProviderUserAuth & {
	lichessUser: LichessUser;
	lichessTokens: LichessTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`LichessUser`](#lichessuser)                                      |
| [`LichessTokens`](#lichesstokens)                                  |

### `LichessTokens`

```ts
type LichessTokens = {
	accessToken: string;
	accessTokenExpiresIn: string;
};
```

## `LichessUser`

```ts
type LichessUser = {
	id: string;
	username: string;
};
```
