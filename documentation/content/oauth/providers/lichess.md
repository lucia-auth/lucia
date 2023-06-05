---
_order: 0
title: "Lichess"
description: "Learn about using the Lichess provider in Lucia OAuth integration"
---

OAuth integration for Lichess. Provider id is `lichess`.

### Initialization

```ts
import { lichess } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const lichessAuth = lichess(auth, config);
```

```ts
const lichess: (
	auth: Auth,
	config: {
		clientId: string;
		redirectUri: string;
		scope?: string[];
	}
) => OAuthProvider<LichessUser, LichessTokens>;
```

#### Parameter

| name                | type                                 | description                             | optional |
| ------------------- | ------------------------------------ | --------------------------------------- | :------: |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                          |          |
| config.clientId     | `string`                             | client id - choose any unique client id |          |
| configs.redirectUri | `string`                             | redirect URI                            |          |
| config.scope        | `string[]`                           | an array of scopes                      |    ✓     |

#### Returns

| type                                              | description      |
| ------------------------------------------------- | ---------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Lichess provider |

## `LichessProvider`

Satisfies [`LichessProvider`](/reference/oauth/oauthprovider).

### `getAuthorizationUrl()`

Returns the authorization url for user redirection, a state and PKCE code verifier. The state and code verifier should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: (
	redirectUri?: string
) => Promise<[url: URL, state: string]>;
```

#### Parameter

| name        | type     | description    | optional |
| ----------- | -------- | -------------- | :------: |
| redirectUri | `string` | a redirect URI |    ✓     |

#### Returns

| name            | type     | description          |
| --------------- | -------- | -------------------- |
| `url`           | `URL`    | authorize url        |
| `state`         | `string` | state parameter used |
| `code_verifier` | `string` | PKCE code verifier   |

### `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (code: string, code_verifier: string) => Promise<ProviderSession>;
```

#### Parameter

| name            | type     | description                      |
| --------------- | -------- | -------------------------------- |
| `code`          | `string` | authorization code from callback |
| `code_verifier` | `string` | PKCE code verifier               |

#### Returns

| type                                                  | description       |
| ----------------------------------------------------- | ----------------- |
| [`ProviderSession`](/reference/oauth/providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

## `LichessTokens`

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
