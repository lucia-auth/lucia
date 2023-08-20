---
title: "Spotify"
description: "Learn how to use the Spotify OAuth provider"
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

### `SpotifyAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<SpotifyAuth<_Auth>>
interface SpotifyAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<SpotifyUserAuth<_Auth>>;
}
```

| type                                |
| ----------------------------------- |
| [`SpotifyUserAuth`](#appleuserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `SpotifyTokens`

```ts
type SpotifyTokens = {
	accessToken: string;
	tokenType: string;
	scope: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
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

### `SpotifyUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	appleUser: SpotifyUser;
	appleTokens: SpotifyTokens;
}
```

| properties    | type                            | description       |
| ------------- | ------------------------------- | ----------------- |
| `appleUser`   | [`SpotifyUser`](#appleuser)     | Spotify user      |
| `appleTokens` | [`SpotifyTokens`](#appletokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
