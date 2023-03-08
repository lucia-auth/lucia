---
_order: 0
title: "Discord"
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
) => OAuthProvider;
```

#### Parameter

| name                | type                          | description                                        | optional |
| ------------------- | ----------------------------- | -------------------------------------------------- | -------- |
| auth                | [`Auth`](/reference/api/auth) | Lucia instance                                     |          |
| config.clientId     | `string`                      | Github OAuth app client id                         |          |
| config.clientSecret | `string`                      | Github OAuth app client secret                     |          |
| configs.redirectUri | `string`                      | an authorized redirect URI                         |          |
| config.scope        | `string[]`                    | an array of scopes - `identify` is always included | true     |

#### Returns

| type                                                           | description      |
| -------------------------------------------------------------- | ---------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) | Discord provider |

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
	avatar: string;
	discriminator: string;
	public_flags: number;
};
```
