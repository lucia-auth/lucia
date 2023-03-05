---
_order: 0
title: "Facebook"
---

OAuth integration for Facebook. Refer to step 1 of [Facebook Login documentation](https://developers.facebook.com/docs/facebook-login/web) for getting the required credentials. Provider id is `facebook`.

```ts
import { facebook } from "@lucia-auth/oauth/providers";
```

The `identity` scope is always included regardless of provided `scope` config.

### Initialization

```ts
import { facebook } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const facebookAuth = facebook(auth, config);
```

```ts
const facebook: (
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

| name                | type                                        | description                                        | optional |
| ------------------- | ------------------------------------------- | -------------------------------------------------- | -------- |
| auth                | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                                     |          |
| config.clientId     | `string`                                    | Github OAuth app client id                         |          |
| config.clientSecret | `string`                                    | Github OAuth app client secret                     |          |
| configs.redirectUri | `string`                                    | an authorized redirect URI                         |          |
| config.scope        | `string[]`                                  | an array of scopes - `identity` is always included | true     |

#### Returns

| type                                                           | description       |
| -------------------------------------------------------------- | ----------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) | Facebook provider |

## `FacebookTokens`

```ts
type FacebookTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
};
```

## `FacebookUser`

```ts
type FacebookUser = {
	id: string;
	name: string;
	picture: string;
};
```
