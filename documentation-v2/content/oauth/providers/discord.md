---
order:: 0
title: "Discord"
description: "Learn about using the Discord provider in Lucia OAuth integration"
---

OAuth integration for Discord. Refer to [Discord API documentation](https://discord.com/developers/docs/getting-started) for getting the required credentials. Provider id is `discord`.

```ts
import { discord } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const discordAuth = discord(auth, config);
```

The `identify` scope is always included regardless of provided `scope` config.

## `discord()`

```ts
const discord: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => DiscordProvider;
```

##### Parameters

| name                  | type                                       | description                                        | optional |
| --------------------- | ------------------------------------------ | -------------------------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                     |          |
| `config.clientId`     | `string`                                   | Discord OAuth app client id                        |          |
| `config.clientSecret` | `string`                                   | Discord OAuth app client secret                    |          |
| `configs.redirectUri` | `string`                                   | an authorized redirect URI                         |          |
| `config.scope`        | `string[]`                                 | an array of scopes - `identify` is always included |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`DiscordProvider`](#discordprovider) | Discord provider |

## Interfaces

### `DiscordProvider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

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
const validateCallback: (code: string) => Promise<DiscordUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                  |
| ------------------------------------- |
| [`DiscordUserAuth`](#discorduserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `DiscordUserAuth`

```ts
type DiscordUserAuth = ProviderUserAuth & {
	discordUser: DiscordUser;
	discordTokens: DiscordTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`DiscordUser`](#discorduser)                                      |
| [`DiscordTokens`](#discordtokens)                                  |

### `DiscordTokens`

```ts
type DiscordTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

### `DiscordUser`

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
