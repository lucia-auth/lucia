---
title: "Linkedin"
description: "Learn how to use the LinkedIn OAuth provider"
---

OAuth integration for Linkedin. Refer to [Linkedin OAuth documentation](https:/.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS1) for getting the required credentials. Provider id is `linkedin`.

```ts
import { linkedin } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const linkedinAuth = linkedin(auth, config);
```

## `linkedin()`

```ts
const linkedin: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => LinkedinProvider;
```

##### Parameters

| name                  | type                                       | description                                             | optional |
| --------------------- | ------------------------------------------ | ------------------------------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                          |          |
| `config.clientId`     | `string`                                   | Linkedin OAuth app client id                            |          |
| `config.clientSecret` | `string`                                   | Linkedin OAuth app client secret                        |          |
| `config.redirectUri`  | `string`                                   | Linkedin OAuth app redirect uri                         |          |
| `config.scope`        | `string[]`                                 | an array of scopes - `r_liteprofile` is always included |    ✓     |

##### Returns

| type                                    | description       |
| --------------------------------------- | ----------------- |
| [`LinkedinProvider`](#linkedinprovider) | Linkedin provider |

## Interfaces

### `LinkedinAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<LinkedinAuth<_Auth>>
interface LinkedinAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<LinkedinUserAuth<_Auth>>;
}
```

| type                                    |
| --------------------------------------- |
| [`LinkedinUserAuth`](#linkedinuserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `LinkedinTokens`

```ts
type LinkedinTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
};
```

### `LinkedinUser`

```ts
type LinkedinUser = {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	locale: {
		country: string;
		language: string;
	};
	picture: string;
};
```

### `LinkedinUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	linkedinUser: LinkedinUser;
	linkedinTokens: LinkedinTokens;
}
```

| properties       | type                                | description       |
| ---------------- | ----------------------------------- | ----------------- |
| `linkedinUser`   | [`LinkedinUser`](#linkedinuser)     | Linkedin user     |
| `linkedinTokens` | [`LinkedinTokens`](#linkedintokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
