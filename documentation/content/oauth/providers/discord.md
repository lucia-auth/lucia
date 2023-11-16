---
title: "Discord OAuth provider"
description: "Learn how to use the Discord OAuth provider"
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
| `config.redirectUri`  | `string`                                   | an authorized redirect URI                         |          |
| `config.scope`        | `string[]`                                 | an array of scopes - `identify` is always included |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`DiscordProvider`](#discordprovider) | Discord provider |

## Interfaces

### `DiscordAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<DiscordAuth<_Auth>>
interface DiscordAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<DiscordUserAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`DiscordUserAuth`](#discorduserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `DiscordTokens`

```ts
type DiscordTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};
```

### `DiscordUser`

```ts
type DiscordUser = {
	id: string;
	username: string;
	discriminator: string;
	global_name: string | null;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	verified?: boolean;
	email?: string | null;
	flags?: number;
	banner?: string | null;
	accent_color?: number | null;
	premium_type?: number;
	public_flags?: number;
	locale?: string;
	avatar_decoration?: string | null;
};
```

### `DiscordUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface DiscordUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	discordUser: DiscordUser;
	discordTokens: DiscordTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `discordUser`   | [`DiscordUser`](#discorduser)     | Discord user      |
| `discordTokens` | [`DiscordTokens`](#discordtokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
