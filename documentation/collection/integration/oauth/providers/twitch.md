---
_order: 0
title: "Twitch"
---

OAuth integration for Twitch. Refer to [Twitch OAuth documentation](https://dev.twitch.tv/docs/authentication) for getting the required credentials. Provider id is `twitch`.

```ts
import { twitch } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { twitch } from "@lucia-auth/oauth/providers";
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

#### Returns

| type                | description     |
| ------------------- | --------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) | Twitch provider |

## `TwitchTokens`

```ts
type TwitchTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

## `TwitchUser`

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
