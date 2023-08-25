---
title: "Cognito"
description: "Learn about using the AWS Cognito provider in Lucia OAuth integration"
---

OAuth integration for AWS Cognito's hosted UI. Refer to the Cognito docs:

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
		hostedUiDomain: string;
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
| `config.hostedUiDomain` | `string`                                   | AWS Cognito's hosted UI domain                   |          |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`CognitoProvider`](#cognitoprovider) | Cognito provider |

## Interfaces

### `CognitoProvider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

#### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
```

##### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

#### `validateCallback()`

Validates the callback code.

```ts
const validateCallback: (code: string) => Promise<CognitoUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                  |
| ------------------------------------- |
| [`CognitoUserAuth`](#cognitouserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).
ID token decoding errors are thrown as [`IdTokenError`](/reference/oauth/interfaces#idtokenerror).

### `CognitoUserAuth`

```ts
type CognitoUserAuth = ProviderUserAuth & {
	cognitoUser: CognitoUser;
	cognitoTokens: CognitoTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`CognitoUser`](#cognitouser)                                      |
| [`CognitoTokens`](#cognitotokens)                                  |

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
	cognitoUsername: string;
	cognitoGroups: string[];
	address?: string;
	birthdate?: string;
	email?: string;
	emailVerified?: boolean;
	familyName?: string;
	gender?: string;
	givenName?: string;
	locale?: string;
	middleName?: string;
	name?: string;
	nickname?: string;
	picture?: string;
	preferredUsername?: string;
	profile?: string;
	website?: string;
	zoneInfo?: string;
	phoneNumber?: string;
	phoneNumberVerified?: boolean;
	updatedAt?: number;
};
```
