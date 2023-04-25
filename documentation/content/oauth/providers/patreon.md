---
_order: 0
title: "Patreon"
description: "Learn about using the Patreon provider in Lucia OAuth integration"
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
) => OAuthProvider<PatreonUser, PatreonTokens>;
```

#### Parameter

| name                 | type                                 | description                                        | optional |
| -------------------- | ------------------------------------ | -------------------------------------------------- | :------: |
| auth                 | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                     |          |
| configs.clientId     | `string`                             | Patreon OAuth app client id                        |          |
| configs.clientSecret | `string`                             | Patreon OAuth app client secret                    |          |
| configs.redirectUri  | `string`                             | one of the authorized redirect URIs                |          |
| configs.scope        | `string[]`                           | an array of scopes - `identity` is always included |    ✓     |

#### Returns

| type                                              | description      |
| ------------------------------------------------- | ---------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Patreon provider |

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
