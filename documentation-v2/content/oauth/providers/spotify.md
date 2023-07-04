---
order:: 0
title: "Spotify"
description: "Learn about using the Spotify provider in Lucia OAuth integration"
---

OAuth integration for Spotify. Refer to [Spotify OAuth documentation](https://developer.spotify.com/documentation/web-api/concepts/apps) for getting the required credentials. Provider id is `spotify`.

```ts
import { spotify } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const spotifyAuth = spotify(auth, config);
```

## `spotify()`

```ts
const spotify: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		showDialog?: boolean;
	}
) => SpotifyProvider;
```

##### Parameters

| name                   | type                                       | description                                   | optional |
| ---------------------- | ------------------------------------------ | --------------------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                |          |
| `configs.clientId`     | `string`                                   | Spotify OAuth app client id                   |          |
| `configs.clientSecret` | `string`                                   | Spotify OAuth app client secret               |          |
| `configs.redirectUri`  | `string`                                   | one of the authorized redirect URIs           |          |
| `configs.scope`        | `string[]`                                 | an array of scopes                            |    ✓     |
| `configs.showDialog`   | `boolean`                                  | force the user to approve the app every time. |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`SpotifyProvider`](#spotifyprovider) | Spotify provider |

## Interfaces

### `SpotifyProvider`

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
const validateCallback: (code: string) => Promise<Auth0UserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                  |
| ------------------------------------- |
| [`SpotifyUserAuth`](#spotifyuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `SpotifyUserAuth`

```ts
type SpotifyUserAuth = ProviderUserAuth & {
	spotifyUser: Auth0User;
	spotifyTokens: Auth0Tokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`SpotifyUser`](#spotifyuser)                                      |
| [`SpotifyTokens`](#spotifytokens)                                  |

```ts
import type { SpotifyTokens, SpotifyUser } from "@lucia-auth/oauth/providers";
```

### `SpotifyTokens`

```ts
type SpotifyTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
	scope: string;
	tokenType: string;
};
```

### `SpotifyUser`

```ts
type SpotifyUser = {
	country?: string;
	display_name: string | null;
	email?: string;
	explicit_content: {
		filter_enabled?: boolean;
		filter_locked?: boolean;
	};
	external_urls: {
		spotify: string;
	};
	followers: {
		href: string | null;
		total: number;
	};
	href: string;
	id: string;
	images: [
		{
			url: string;
			height: number | null;
			width: number | null;
		}
	];
	product?: string;
	type: string;
	uri: string;
};
```
