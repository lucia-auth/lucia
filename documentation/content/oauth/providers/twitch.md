---
title: "Twitch OAuth provider"
description: "Learn how to use the Twitch OAuth provider"
---

OAuth integration for Twitch. Refer to [Twitch OAuth documentation](https://dev.twitch.tv/docs/authentication) for getting the required credentials. Provider id is `twitch`.

```ts
import { twitch } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const twitchAuth = twitch(auth, configs);
```

## `twitch()`

```ts
const twitch: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => TwitchProvider;
```

##### Parameters

| name                   | type                                       | description                         | optional |
| ---------------------- | ------------------------------------------ | ----------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                      |          |
| `configs.clientId`     | `string`                                   | Twitch OAuth app client id          |          |
| `configs.clientSecret` | `string`                                   | Twitch OAuth app client secret      |          |
| `configs.redirectUri`  | `string`                                   | one of the authorized redirect URIs |          |
| `configs.scope`        | `string[]`                                 | an array of scopes                  |    ✓     |

##### Returns

| type                                | description     |
| ----------------------------------- | --------------- |
| [`TwitchProvider`](#twitchprovider) | Twitch provider |

## Interfaces

### `TwitchAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<TwitchAuth<_Auth>>
interface TwitchAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<TwitchUserAuth<_Auth>>;
}
```

| type                                |
| ----------------------------------- |
| [`TwitchUserAuth`](#twitchuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `TwitchTokens`

```ts
type TwitchTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};
```

### `TwitchUser`

```ts
type TwitchUser = {
	id: string;
	login: string;
	display_name: string;
	type: "" | "admin" | "staff" | "global_mod";
	broadcaster_type: "" | "affiliate" | "partner";
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	email?: string;
	created_at: string;
};
```

### `TwitchUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	twitchUser: TwitchUser;
	twitchTokens: TwitchTokens;
}
```

| properties     | type                            | description       |
| -------------- | ------------------------------- | ----------------- |
| `twitchUser`   | [`TwitchUser`](#twitchuser)     | Twitch user       |
| `twitchTokens` | [`TwitchTokens`](#twitchtokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
