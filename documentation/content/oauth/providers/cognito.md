---
title: "Amazon Cognito OAuth provider"
description: "Learn about using the Amazon Cognito provider"
---

OAuth integration for Amazon Cognito's hosted UI. Refer to the Cognito docs:

- [Amazon Cognito hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [Authorization endpoint documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)
- [Token endpoint documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html)

Provider id is `cognito`.

```ts
import { cognito } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const cognitoAuth = cognito(auth, configs);
```

## `cognito()`

```ts
const cognito: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		userPoolDomain: string;
	}
) => CognitoProvider;
```

##### Parameters

| name                    | type                                       | description                                      | optional |
| ----------------------- | ------------------------------------------ | ------------------------------------------------ | :------: |
| `auth`                  | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                   |          |
| `config.clientId`       | `string`                                   | Cognito app client id                            |          |
| `config.clientSecret`   | `string`                                   | Cognito app client secret                        |          |
| `configs.redirectUri`   | `string`                                   | an authorized redirect URI                       |          |
| `config.scope`          | `string[]`                                 | an array of scopes - `openid` is always included |    ✓     |
| `config.userPoolDomain` | `string`                                   | Amazon Cognito's user pool domain                |          |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`CognitoProvider`](#cognitoprovider) | Cognito provider |

## Interfaces

### `CognitoAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<CognitoAuth<_Auth>>
interface CognitoAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<CognitoAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`CognitoUserAuth`](#cognitouserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `CognitoTokens`

```ts
type CognitoTokens = {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	accessTokenExpiresIn: number;
	tokenType: string;
};
```

### `CognitoUser`

```ts
type CognitoUser = {
	sub: string;
	"cognito:username": string;
	"cognito:groups": string[];
	address?: {
		formatted?: string;
	};
	birthdate?: string;
	email?: string;
	email_verified?: boolean;
	family_name?: string;
	gender?: string;
	given_name?: string;
	locale?: string;
	middle_name?: string;
	name?: string;
	nickname?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	picture?: string;
	preferred_username?: string;
	profile?: string;
	website?: string;
	zoneinfo?: string;
	updated_at?: number;
};
```

### `CognitoUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface CognitoUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	cognitoUser: CognitoUser;
	cognitoTokens: CognitoTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `cognitoUser`   | [`CognitoUser`](#cognitouser)     | Cognito user      |
| `cognitoTokens` | [`CognitoTokens`](#cognitotokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
