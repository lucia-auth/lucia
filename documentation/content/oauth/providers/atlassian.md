---
title: "Atlassian"
description: "Learn how to use the Atlassian OAuth provider"
---

OAuth 2.0 (Authorization code) integration for Atlassian. Provider id is `atlassian`.

```ts
import { atlassian } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const atlassianAuth = atlassian(auth, configs);
```

## `atlassian()`

Scopes `read:me` is always included.

```ts
const atlassian: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => AtlassianProvider;
```

##### Parameters

| name                   | type                                       | description                       | optional |
| ---------------------- | ------------------------------------------ | --------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                    |          |
| `configs.clientId`     | `string`                                   | Atlassian OAuth app client id     |          |
| `configs.clientSecret` | `string`                                   | Atlassian OAuth app client secret |          |
| `configs.redirectUri`  | `string`                                   | an authorized redirect URI        |          |
| `configs.scope`        | `string[]`                                 | an array of scopes                |    ✓     |

##### Returns

| type                                      | description        |
| ----------------------------------------- | ------------------ |
| [`AtlassianProvider`](#atlassianprovider) | Atlassian provider |

## Interfaces

### `AtlassianAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<AtlassianAuth<_Auth>>
interface AtlassianAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<AtlassianUserAuth<_Auth>>;
}
```

| type                                      |
| ----------------------------------------- |
| [`AtlassianUserAuth`](#atlassianuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `AtlassianTokens`

Add scope `offline_access` to get refresh tokens.

```ts
type AtlassianTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};
```

### `AtlassianUser`

```ts
type AtlassianUser = {
	account_type: string;
	account_id: string;
	email: string;
	name: string;
	picture: string;
	account_status: string;
	nickname: string;
	zoneinfo: string;
	locale: string;
	extended_profile?: Record<string, string>;
};
```

### `AtlassianUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	atlassianUser: AtlassianUser;
	atlassianTokens: AtlassianTokens;
}
```

| properties        | type                                  | description       |
| ----------------- | ------------------------------------- | ----------------- |
| `atlassianUser`   | [`AtlassianUser`](#atlassianuser)     | Atlassian user    |
| `atlassianTokens` | [`AtlassianTokens`](#atlassiantokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
