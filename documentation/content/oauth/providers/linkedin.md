---
title: "LinkedIn"
description: "Learn how to use the LinkedIn OAuth provider"
---

OAuth integration for LinkedIn. Refer to [LinkedIn OAuth documentation](https:/.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS1) for getting the required credentials. Provider id is `linkedin`.

```ts
import { linkedIn } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const linkedInAuth = linkedIn(auth, config);
```

## `linkedIn()`

```ts
const linkedIn: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => LinkedInProvider;
```

##### Parameters

Scope `r_liteprofile` is always included.

| name                  | type                                       | description                      | optional |
| --------------------- | ------------------------------------------ | -------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                   |          |
| `config.clientId`     | `string`                                   | LinkedIn OAuth app client id     |          |
| `config.clientSecret` | `string`                                   | LinkedIn OAuth app client secret |          |
| `config.redirectUri`  | `string`                                   | LinkedIn OAuth app redirect uri  |          |
| `config.scope`        | `string[]`                                 | an array of scopes               |    ✓     |

##### Returns

| type                                    | description       |
| --------------------------------------- | ----------------- |
| [`LinkedInProvider`](#linkedinprovider) | LinkedIn provider |

## Interfaces

### `LinkedInAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<LinkedInAuth<_Auth>>
interface LinkedInAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<LinkedInUserAuth<_Auth>>;
}
```

| type                                    |
| --------------------------------------- |
| [`LinkedInUserAuth`](#linkedinuserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `LinkedInTokens`

```ts
type LinkedInTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
};
```

### `LinkedInUser`

```ts
type LinkedInUser = {
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

### `LinkedInUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	linkedInUser: LinkedInUser;
	linkedInTokens: LinkedInTokens;
}
```

| properties       | type                                | description       |
| ---------------- | ----------------------------------- | ----------------- |
| `linkedInUser`   | [`LinkedInUser`](#linkedinuser)     | LinkedIn user     |
| `linkedInTokens` | [`LinkedInTokens`](#linkedintokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
