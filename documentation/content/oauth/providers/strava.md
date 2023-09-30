---
title: "Strava OAuth provider"
description: "Learn how to use the Strava OAuth provider"
---

OAuth integration for Strava. Refer to [How To Create An Application](https://developers.strava.com/docs/getting-started/#account) for getting the required credentials. Provider id is `strava`.

```ts
import { strava } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const stravaAuth = strava(auth, config);
```

## `strava()`

```ts
const strava: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		scope?: string[];
		redirectUri?: string;
	}
) => GithubProvider;
```

##### Parameters

| name                  | type                                       | description                    | optional |
| --------------------- | ------------------------------------------ | ------------------------------ | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                 |          |
| `config.clientId`     | `string`                                   | Strava OAuth app client id     |          |
| `config.clientSecret` | `string`                                   | Strava OAuth app client secret |          |
| `config.scope`        | `string[]`                                 | an array of scopes             |    ✓     |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI     |    ✓     |

##### Returns

| type                                | description     |
| ----------------------------------- | --------------- |
| [`StravaProvider`](#stravaprovider) | Strava provider |

## Interfaces

### `StravaAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<GithubAuth<_Auth>>
interface StravaAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<StravaUserAuth<_Auth>>;
}
```

| type                                |
| ----------------------------------- |
| [`StravaUserAuth`](#stravauserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `StravaTokens`

```ts
type  =
  | {
    accessToken: string;
    user: StravaUser;
  }
	| {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    user: StravaUser;
  };
```

### `StravaUser`

```ts
export type StravaUser = {
	id: number;
	username: string;
	resource_state: number;
	firstname: string;
	lastname: string;
	bio: string;
	city: string;
	country: string;
	sex: string;
	premium: boolean;
	summit: boolean;
	created_at: string;
	updated_at: string;
	badge_type_id: number;
	weight: number;
	profile_medium: string;
	profile: string;
};
```

### `StravaUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface StravaUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	stravaUser: StravaUser;
	stravaTokens: StravaTokens;
}
```

| properties     | type                            | description       |
| -------------- | ------------------------------- | ----------------- |
| `stravaUser`   | [`StravaUser`](#stravauser)     | Strava user       |
| `stravaTokens` | [`StravaTokens`](#stravatokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
