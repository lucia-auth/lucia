---
_order: 0
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

| name                 | type                                        | description                                                          | optional |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------------- | -------- |
| auth                 | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                                                       |          |
| configs.clientId     | `string`                                    | Twitch OAuth app client id                                           |          |
| configs.clientSecret | `string`                                    | Twitch OAuth app client secret                                       |          |
| configs.redirectUri  | `string`                                    | one of the authorized redirect URIs                                  |          |
| configs.forceVerify  | `boolean`                                   | forces the user to re-authorize your app’s access to their resources | true     |
| configs.scope        | `string[]`                                  | an array of scopes                                                   | true     |

### Redirect user to authorization url

Redirect the user to Twitch's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import twitch from "@lucia-auth/oauth/twitch";
import { auth } from "./lucia.js";

const twitchAuth = twitch(auth, configs);

const [authorizationUrl, state] = twitchAuth.getAuthorizationUrl();

// the state can be stored in cookies or localstorage for request validation on callback
setCookie("state", state, {
	path: "/",
	httpOnly: true, // only readable in the server
	maxAge: 60 * 60 // a reasonable expiration date
}); // example with cookie
```

### Validate callback

The authorization code and state can be retrieved from the `code` and `state` search params, respectively, inside the callback url. Validate that the state is the same as the one stored in either cookies or localstorage before passing the `code` to `validateCallback()`.

```ts
import twitch from "@lucia-auth/oauth/twitch";
const twitchAuth = twitch();

// get code and state from search params
const url = new URL(callbackUrl);
const code = url.searchParams.get("code") || ""; // http://localhost:3000/api/twitch?code=abc&state=efg => abc
const state = url.searchParams.get("state") || ""; // http://localhost:3000/api/twitch?code=abc&state=efg => efg

// get state stored in cookie (refer to previous step)
const storedState = headers.cookie.get("state");

// validate state
if (state !== storedState) throw new Error(); // invalid state

const twitchSession = await twitchAuth.validateCallback(code);
```

## `twitch()` (default)

Refer to [`Initialization`](/oauth/providers/twitch#initialization).

## `TwitchProvider`

```ts
interface TwitchProvider {
	getAuthorizationUrl: <State = string | null | undefined = undefined>(state?: State) => State extends null ? [url: string] : [url: string, state: string]
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
const createUser: (userAttributes: Lucia.UserAttributes | undefined) => Promise<User>;
```

Creates a new using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name               | value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| provider           | `"twitch"`                                                             |
| identifier         | Twitch user id ([`TwitchUser.id`](/oauth/providers/twitch#twitchuser)) |
| options.attributes | `userAttributes ?? {}`                                                 |

`options.attributes` can be `undefined` (optional) if `Lucia.UserAttributes` is empty.

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
