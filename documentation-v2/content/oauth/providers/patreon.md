---
order:: 0
title: "Patreon"
description: "Learn about using the Patreon provider in Lucia OAuth integration"
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
		allMemberships?: boolean;
	}
) => PatreonProvider;
```

##### Parameters

| name                   | type                                       | description                                        | optional |
| ---------------------- | ------------------------------------------ | -------------------------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                     |          |
| `configs.clientId`     | `string`                                   | Patreon OAuth app client id                        |          |
| `configs.clientSecret` | `string`                                   | Patreon OAuth app client secret                    |          |
| `configs.redirectUri`  | `string`                                   | one of the authorized redirect URIs                |          |
| `configs.scope`        | `string[]`                                 | an array of scopes - `identity` is always included |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`PatreonProvider`](#patreonprovider) | Patreon provider |

## Interfaces

### `PatreonProvider`

Satisfied [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

```ts
type PatreonProvider = OAuthProvider<PatreonUser, PatreonTokens>;
```

#### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
```

##### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

#### `validateCallback()`

Validates the callback code.

```ts
const validateCallback: (code: string) => Promise<PatreonUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                  |
| ------------------------------------- |
| [`PatreonUserAuth`](#patreonuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `PatreonUserAuth`

```ts
type PatreonUserAuth = ProviderUserAuth & {
	patreonUser: PatreonUser;
	patreonTokens: PatreonTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`PatreonUser`](#patreonuser)                                      |
| [`PatreonTokens`](#patreontokens)                                  |

### `PatreonTokens`

```ts
type PatreonTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: string;
};
```

### `PatreonUser`

```ts
type PatreonUser = {
	id: string;
	attributes: {
		about: string | null;
		created: string;
		email?: string; // only included for certain scopes
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		url: string;
	};
};
```
