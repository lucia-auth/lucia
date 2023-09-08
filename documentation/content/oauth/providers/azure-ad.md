---
title: "Azure Active Directory OAuth provider"
description: "Learn how to use the Azure Active Directory OAuth provider"
---

OAuth integration for Azure Active Directory with PKCE. Provider id is `azure_ad`.

```ts
import { azureAD } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const AzureADAuth = azureAD(auth, config);
```

## `azureAd()`

The `oidc` and `profile` scope are always included.

```ts
const azureAd: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		tenant: string;
		redirectUri: string;
		scope?: string[];
	}
) => AzureADProvider;
```

##### Parameter

| name                  | type                                       | description        | optional |
| --------------------- | ------------------------------------------ | ------------------ | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance     |          |
| `config.clientId`     | `string`                                   | client id          |          |
| `config.clientSecret` | `string`                                   | client secret      |          |
| `config.tenant`       | `string`                                   | tenant identifier  |          |
| `config.redirectUri`  | `string`                                   | redirect URI       |          |
| `config.scope`        | `string[]`                                 | an array of scopes |    ✓     |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`AzureADProvider`](#azureadprovider) | AzureAD provider |

## Interfaces

### `AzureADAuth`

See [`OAuth2ProviderAuthWithPKCE`](/reference/oauth/interfaces/oauth2providerauthwithpkce).

```ts
// implements OAuth2ProviderAuthWithPKCE<AzureADAuth<_Auth>>
interface AzureADAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<
		readonly [url: URL, codeVerifier: string, state: string]
	>;
	validateCallback: (code: string) => Promise<AzureADUserAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`AzureADUserAuth`](#azureaduserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `AzureADTokens`

```ts
type AzureADTokens = {
	idToken: string;
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};
```

### `AzureADUser`

```ts
type AzureADUser = {
	sub: string;
	name: string;
	family_name: string;
	given_name: string;
	picture: string;
	email?: string; // requires `email` scope
};
```

### `AzureADUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface AzureADUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	azureADUser: AzureADUser;
	azureADTokens: AzureADTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `azureADUser`   | [`AzureADUser`](#azureaduser)     | AzureAD user      |
| `azureADTokens` | [`AzureADTokens`](#azureadtokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
