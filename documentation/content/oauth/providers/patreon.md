---
title: "Patreon"
description: "Learn how to use the Patreon OAuth provider"
---

OAuth integration for Patreon. Refer to [Patreon OAuth documentation](https://docs.patreon.com/#clients-and-api-keys) for getting the required credentials. Provider id is `patreon`.

```ts
import { patreon } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const patreonAuth = patreon(auth, configs);
```

The `identity` scope is always included regardless of provided `scope` config.

## `patreon()`

```ts
const patreon: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => PatreonProvider;
```

##### Parameters

Scope `identity` is always included.

| name                   | type                                       | description                         | optional |
| ---------------------- | ------------------------------------------ | ----------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                      |          |
| `configs.clientId`     | `string`                                   | Patreon OAuth app client id         |          |
| `configs.clientSecret` | `string`                                   | Patreon OAuth app client secret     |          |
| `configs.redirectUri`  | `string`                                   | one of the authorized redirect URIs |          |
| `configs.scope`        | `string[]`                                 | an array of scopes                  |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`PatreonProvider`](#patreonprovider) | Patreon provider |

## Interfaces

### `PatreonAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<PatreonAuth<_Auth>>
interface PatreonAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<PatreonUserAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`PatreonUserAuth`](#patreonuserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `PatreonTokens`

```ts
type PatreonTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
};
```

### `PatreonUser`

```ts
type PatreonUser = {
	id: string;
	attributes: {
		about: string | null;
		created: string;
		email?: string;
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		url: string;
	};
};
```

### `PatreonUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	patreonUser: PatreonUser;
	patreonTokens: PatreonTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `patreonUser`   | [`PatreonUser`](#patreonuser)     | Patreon user      |
| `patreonTokens` | [`PatreonTokens`](#patreontokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
