---
_order: 0
title: "Discord"
description: "Learn about using the Discord provider in Lucia OAuth integration"
---

OAuth integration for Discord. Refer to [Discord API documentation](https://discord.com/developers/docs/getting-started) for getting the required credentials. Provider id is `discord`.

```ts
import { discord } from "@lucia-auth/oauth/providers";
```

The `identify` scope is always included regardless of provided `scope` config.

### Initialization

```ts
import { discord } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const discordAuth = discord(auth, config);
```

```ts
const discord: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => OAuthProvider<DiscordUser, DiscordTokens>;
```

#### Parameter

| name                | type                                 | description                                        | optional |
| ------------------- | ------------------------------------ | -------------------------------------------------- | :------: |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                     |          |
| config.clientId     | `string`                             | Discord OAuth app client id                        |          |
| config.clientSecret | `string`                             | Discord OAuth app client secret                    |          |
| configs.redirectUri | `string`                             | an authorized redirect URI                         |          |
| config.scope        | `string[]`                           | an array of scopes - `identify` is always included |    ✓     |

#### Returns

| type                                              | description      |
| ------------------------------------------------- | ---------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Discord provider |

## `DiscordProvider`

Satisfies [`OAuthProvider`](/reference/oauth/oauthprovider).

### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: (
	redirectUri?: string
) => Promise<[url: URL, state: string]>;
```

#### Parameter

| name        | type     | description                | optional |
| ----------- | -------- | -------------------------- | :------: |
| redirectUri | `string` | an authorized redirect URI |    ✓     |

#### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

### `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (code: string) => Promise<ProviderSession>;
```

#### Parameter

| name | type     | description                      |
| ---- | -------- | -------------------------------- |
| code | `string` | authorization code from callback |

#### Returns

| type                                                  | description       |
| ----------------------------------------------------- | ----------------- |
| [`ProviderSession`](/reference/oauth/providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

## `DiscordTokens`

```ts
type DiscordTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

## `DiscordUser`

```ts
type DiscordUser = {
	id: string;
	username: string;
	discriminator: string;
	avatar: string;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	verified?: boolean;
	email?: string;
	flags?: number;
	banner?: string;
	accent_color?: number;
	premium_type?: number;
	public_flags?: number;
	locale?: string;
};
```
