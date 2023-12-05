---
title: "OneLogin OAuth provider"
description: "Learn how to use the OneLogin OAuth provider"
---

OAuth integration for OneLogin. Refer to the OneLogin docs:
- [Dev Overview of OpenID Connect](https://developers.onelogin.com/openid-connect)
- [API Reference - Latest](https://developers.onelogin.com/openid-connect/api)

Provider id is `onelogin`.

```ts
import { onelogin } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const oneloginAuth = onelogin(auth, config);
```
``
## `onelogin()`
```ts
const onelogin: (
    auth: Auth,
    config: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string[];
        subdomain: string;
    } = OneloginAuth;
```

##### Parameters
| name                  | type                                       | description                        | optional |
| --------------------- | ------------------------------------------ | ---------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                     |          |
| `config.clientId`     | `string`                                   | OneLogin OAuth app client id       |          |
| `config.clientSecret` | `string`                                   | OneLogin OAuth app client secret   |          |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI         |          |
| `config.scope`        | `string[]`                                 | an array of scopes                 |    ✓     |
| `config.subdomain`        | `string[]`                             | the subdomain for OneLogin entity  |          |

##### Returns
| type                              | description           |
| --------------------------------- | --------------------- |
| [`OneloginAuth`](#oneloginauth)   | OneLogin oauth provider |

## Interfaces

### `OneloginAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<OneloginAuth<_Auth>>
interface OneloginAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuthWithPKCE<OneloginUserAuth<_Auth>> {
    getAuthorizationUrl = async (): Promise<readonly [url: URL, codeVerifier: string, state: string]>;

    validateCallback = async (
		code: string,
		code_verifier: string
	): Promise<OneloginUserAuth<_Auth>>;
}
```

| type                              |
| --------------------------------- |
| [`OneloginUserAuth`](#oneloginuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `OneloginTokens`

```ts
type OneloginTokens = {
	accessToken: string;
	refreshToken: string | null;
};
```

### `OneloginUser`
```ts
type OneloginUser = {
	sub: string;
	email: string;
	preferred_username: string;
	name: string;
	updated_at: number;
	given_name: string;
	family_name: string;
	groups?: string[];
};
```

### `OneloginUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface OneloginUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
	public oneloginTokens: OneloginTokens;
	public oneloginUser: OneloginUser;
}
```

| properties       | type                                | description        |
| ---------------- | ----------------------------------- | ------------------ |
| `oneloginUser`   | [`OneloginUser`](#OneloginUser)     | OneLogin user      |
| `oneloginTokens` | [`OneloginTokens`](#OneloginTokens) | Access tokens, etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |