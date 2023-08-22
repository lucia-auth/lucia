---
title: "Line"
description: "Learn how to use the Line OAuth provider"
---

OAuth 2.0 integration for Line (v2.1). Provider id is `line`.

```ts
import { line } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const lineAuth = line(auth, configs);
```

## `line()`

Scopes `oidc` are `profile` are always included.

```ts
const line: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => LineProvider;
```

##### Parameters

| name                   | type                                       | description                  | optional |
| ---------------------- | ------------------------------------------ | ---------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance               |          |
| `configs.clientId`     | `string`                                   | Line OAuth app client id     |          |
| `configs.clientSecret` | `string`                                   | Line OAuth app client secret |          |
| `configs.redirectUri`  | `string`                                   | an authorized redirect URI   |          |
| `configs.scope`        | `string[]`                                 | an array of scopes           |    ✓     |

##### Returns

| type                            | description   |
| ------------------------------- | ------------- |
| [`LineProvider`](#lineprovider) | Line provider |

## Interfaces

### `LineAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<LineAuth<_Auth>>
interface LineAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<LineUserAuth<_Auth>>;
}
```

| type                            |
| ------------------------------- |
| [`LineUserAuth`](#lineuserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `LineTokens`

```ts
type LineTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	idToken: string;
};
```

### `LineUser`

Add `email` scope to get `LineUser.email`.

```ts
type LineUser = {
	userId: string;
	displayName: string;
	pictureUrl: string;
	statusMessage: string;
	email: string | null;
};
```

### `LineUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	lineUser: LineUser;
	lineTokens: LineTokens;
}
```

| properties   | type                        | description       |
| ------------ | --------------------------- | ----------------- |
| `lineUser`   | [`LineUser`](#lineuser)     | Line user         |
| `lineTokens` | [`LineTokens`](#linetokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
