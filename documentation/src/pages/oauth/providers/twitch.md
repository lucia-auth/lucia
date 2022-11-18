---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Twitch"
---

OAuth integration for Twitch. Refer to [Twitch OAuth documentation](https://dev.twitch.tv/docs/authentication) for getting the required credentials.

### Initialization

```ts
import twitch from "@lucia-auth/oauth/twitch";
import { auth } from "./lucia.js";

const twitchAuth = twitch(auth, configs);
```

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

#### Parameter

| name                 | type                                        | description                                                          |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| auth                 | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                                                       |
| configs.clientId     | `string`                                    | Twitch OAuth app client id                                           |
| configs.clientSecret | `string`                                    | Twitch OAuth app client secret                                       |
| configs.redirectUri  | `string`                                    | one of the authorized redirect URIs                                  |
| configs.forceVerify  | `boolean`                                   | forces the user to re-authorize your app’s access to their resources |
| configs.scope        | `string[]`                                  | an array of scopes                                                   |

### Redirect user to authorization url

Redirect the user to Twitch's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import twitch from "@lucia-auth/oauth/twitch";
import { auth } from "./lucia.js";

const twitchAuth = twitch(auth, configs);

const authorizationUrl = twitchAuth.getAuthorizationUrl();
```

### Validate callback

The authorization code can be retrieved from the `code` search params inside the callback url.

```ts
import twitch from "@lucia-auth/oauth/twitch";
const twitchAuth = twitch();

const code = new URL(callbackUrl).searchParams.get("code") || ""; // http://localhost:3000/api/twitch?code=abc => abc
const twitchSession = await twitchAuth.validateCallback(code);
```

## `twitch()` (default)

Refer to [`Initialization`](/oauth/providers/twitch#initialization).

## `TwitchProvider`

```ts
interface TwitchProvider {
	getAuthorizationUrl: () => string;
	validateCallback: (code: string) => Promise<TwitchProviderSession>;
}
```

Implements [`OAuthProvider`](/oauth/reference/api-reference#oauthprovider).

### `getAuthorizationUrl()`

Refer to [`OAuthProvider.getAuthorizationUrl()`](/oauth/reference/api-reference#getauthorizationurl).

### `validateCallback()`

Implements [`OAuthProvider.validateCallback()`](/oauth/reference/api-reference#getauthorizationurl). `code` can be acquired from the `code` search params inside the callback url.

```ts
const validateCallback: (code: string) => Promise<TwitchProviderSession>;
```

#### Returns

| type                                                                     |
| ------------------------------------------------------------------------ |
| [`TwitchProviderSession`](/oauth/providers/twitch#twitchprovidersession) |

## `TwitchProviderSession`

```ts
interface TwitchProviderSession {
	existingUser: User | null;
	createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
	providerUser: TwitchUser;
	accessToken: string;
}
```

Implements [`ProviderSession`](/oauth/reference/api-reference#providersession).

| name                                             | type                                                  | description                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| existingUser                                     | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createUser](/oauth/providers/twitch#createuser) | `Function`                                            |                                                   |
| providerUser                                     | [`TwitchUser`](/oauth/providers/twitch#twitchuser)    | Twitch user                                       |
| accessToken                                      | `string`                                              | Twitch access token                               |

### `createUser()`

```ts
const createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
```

Creates a new using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name               | value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| provider           | `"twitch"`                                                             |
| identifier         | Twitch user id ([`TwitchUser.id`](/oauth/providers/twitch#twitchuser)) |
| options.attributes | `userAttributes`                                                       |

## `TwitchUser`

```ts
interface TwitchUser {
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
}
```
