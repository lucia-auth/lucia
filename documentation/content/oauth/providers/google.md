---
_order: 0
title: "Google"
---

OAuth integration for Google. Refer to [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server#httprests) for getting the required credentials. Provider id is `google`.

```ts
import { google } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { google } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const googleAuth = google(auth, configs);
```

```ts
const google: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => GoogleProvider;
```

#### Parameter

| name                 | type                          | description                    | optional |
| -------------------- | ----------------------------- | ------------------------------ | -------- |
| auth                 | [`Auth`](/reference/api/auth) | Lucia instance                 |          |
| configs.clientId     | `string`                      | Google OAuth app client id     |          |
| configs.clientSecret | `string`                      | Google OAuth app client secret |          |
| configs.redirectUri  | `string`                      | an authorized redirect URI     |          |
| configs.scope        | `string[]`                    | an array of scopes             | true     |

#### Returns

| type                                                           | description     |
| -------------------------------------------------------------- | --------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) | Google provider |

## `GoogleTokens`

```ts
type GoogleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: string;
};
```

## `GoogleUser`

```ts
type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
	hd: string;
};
```
