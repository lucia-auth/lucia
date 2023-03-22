---
_order: 0
title: "Patreon"
---

OAuth integration for Patreon. Refer to [Patreon OAuth documentation](https://docs.patreon.com/#clients-and-api-keys) for getting the required credentials. Provider id is `patreon`.

```ts
import { patreon } from "@lucia-auth/oauth/providers";
```

The `identity` scope is always included regardless of provided `scope` config.

### Initialization

```ts
import { patreon } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const patreonAuth = patreon(auth, configs);
```

```ts
const patreon: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		allMemberships?: boolean;
	}
) => PatreonProvider;
```

#### Parameter

| name                 | type                          | description                                        | optional |
| -------------------- | ----------------------------- | -------------------------------------------------- | -------- |
| auth                 | [`Auth`](/reference/api/auth) | Lucia instance                                     |          |
| configs.clientId     | `string`                      | Patreon OAuth app client id                        |          |
| configs.clientSecret | `string`                      | Patreon OAuth app client secret                    |          |
| configs.redirectUri  | `string`                      | one of the authorized redirect URIs                |          |
| configs.scope        | `string[]`                    | an array of scopes - `identity` is always included | true     |

#### Returns

| type                                                           | description      |
| -------------------------------------------------------------- | ---------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) | Patreon provider |

## `PatreonTokens`

```ts
type PatreonTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: string;
};
```

## `PatreonUser`

```ts
type PatreonUser = {
	id: string;
	attributes: {
		about: string | null;
		created: string;
		email?: string; // only included for certain scopes
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		url: string;
	};
};
```
