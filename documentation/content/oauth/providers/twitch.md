---
order:: 0
title: "Twitch"
description: "Learn about using the Twitch provider in Lucia OAuth integration"
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
		forceVerify?: boolean;
		scope?: string[];
	}
) => TwitchProvider;
```

##### Parameters

| name                   | type                                       | description                                                          | optional |
| ---------------------- | ------------------------------------------ | -------------------------------------------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                                       |          |
| `configs.clientId`     | `string`                                   | Twitch OAuth app client id                                           |          |
| `configs.clientSecret` | `string`                                   | Twitch OAuth app client secret                                       |          |
| `configs.redirectUri`  | `string`                                   | one of the authorized redirect URIs                                  |          |
| `configs.forceVerify`  | `boolean`                                  | forces the user to re-authorize your app’s access to their resources |    ✓     |
| `configs.scope`        | `string[]`                                 | an array of scopes                                                   |    ✓     |

##### Returns

| type                                | description     |
| ----------------------------------- | --------------- |
| [`TwitchProvider`](#twitchprovider) | Twitch provider |

## Interfaces

### `TwitchProvider`

Satisfied [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

```ts
type TwitchProvider = OAuthProvider<TwitchUser, TwitchTokens>;
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
const validateCallback: (code: string) => Promise<TwitchUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                |
| ----------------------------------- |
| [`TwitchUserAuth`](#twitchuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `TwitchUserAuth`

```ts
type TwitchUserAuth = ProviderUserAuth & {
	twitchUser: TwitchUser;
	twitchTokens: TwitchTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`TwitchUser`](#twitchuser)                                        |
| [`TwitchTokens`](#twitchtokens)                                    |

### `TwitchTokens`

```ts
type TwitchTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

### `TwitchUser`

```ts
type TwitchUser = {
	id: string; // user id
	login: string; // username
	display_name: string;
	type: "" | "admin" | "staff" | "global_mod";
	broadcaster_type: "" | "affiliate" | "partner";
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	email: string;
	created_at: string;
};
```
