---
title: "Lichess OAuth provider"
description: "Learn how to use the Lichess OAuth provider"
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

| name                 | type                                       | description                             | optional |
| -------------------- | ------------------------------------------ | --------------------------------------- | :------: |
| `auth`               | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                          |          |
| `config.clientId`    | `string`                                   | client id - choose any unique client id |          |
| `config.redirectUri` | `string`                                   | redirect URI                            |          |
| `config.scope`       | `string[]`                                 | an array of scopes                      |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`LichessProvider`](#lichessprovider) | Lichess provider |

## Interfaces

### `LichessAuth`

See [`OAuth2ProviderAuthWithPKCE`](/reference/oauth/interfaces/oauth2providerauthwithpkce).

```ts
// implements OAuth2ProviderAuthWithPKCE<LichessAuth<_Auth>>
interface LichessAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<
		readonly [url: URL, codeVerifier: string, state: string]
	>;
	validateCallback: (
		code: string,
		codeVerifier: string
	) => Promise<LichessUserAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`LichessUserAuth`](#lichessuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `LichessTokens`

```ts
type LichessTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
};
```

### `LichessUser`

```ts
type LichessUser = {
	id: string;
	username: string;
};
```

### `LichessUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface LichessUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	lichessUser: LichessUser;
	lichessTokens: LichessTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `lichessUser`   | [`LichessUser`](#lichessuser)     | Lichess user      |
| `lichessTokens` | [`LichessTokens`](#lichesstokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
