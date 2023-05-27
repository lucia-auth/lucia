---
_order: 0

title: "Apple"

description: "Learn about using the Apple provider in Lucia OAuth integration"
---

**Before starting make sure you have an paid apple dev account**

OAuth integration for Apple. Refer to Apple Docs:

- [Creating App ID](https://developer.apple.com/help/account/manage-identifiers/register-an-app-id/)
- [Creating Service ID](https://developer.apple.com/help/account/manage-identifiers/register-a-services-id)
- [Enable "Sign In with Apple" Capability](https://developer.apple.com/help/account/manage-identifiers/enable-app-capabilities)
- [Creating Private Key](https://developer.apple.com/help/account/manage-keys/create-a-private-key)
- [Locate the keyId](https://developer.apple.com/help/account/manage-keys/get-a-key-identifier)
- [How to locate your teamId](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id)
- [Requesting Access Token](https://developer.apple.com/documentation/sign_in_with_apple/request_an_authorization_to_the_sign_in_with_apple_server)
- [How to validate tokens](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens)

Provider id is `apple`.

```ts
import { apple } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { apple } from "@lucia-auth/oauth/providers";

import { auth } from "./lucia.js";

const appleAuth = apple(auth, configs);
```

```ts
const apple: (
	auth: Auth,
	configs: {
		clientId: string;
		redirectUri: string;
		teamId: string;
		keyId: string;
		certificate: string;
	}
) => OAuthProvider<AppleUser, AppleTokens>;
```

#### Parameter

| name                | type                                 | description                | optional |
| ------------------- | ------------------------------------ | -------------------------- | :------: |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance             |          |
| configs.clientId    | `string`                             | Apple service identifier   |          |
| configs.redirectUri | `string`                             | an authorized redirect URI |          |
| configs.teamId      | `string`                             | Apple teamId               |          |
| configs.keyId       | `string`                             | Apple private keyId        |          |
| configs.certificate | `string`                             | p8 certificate as string   |          |

#### Returns

| type                                              | description    |
| ------------------------------------------------- | -------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Apple provider |

## `AppleProvider`

Satisfies [`OAuthProvider`](/reference/oauth/oauthprovider).

### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: (
	redirectUri?: string
) => Promise<[url: URL, state: string]>;
```

#### Parameter

| name        | type     | description                | optional |
| ----------- | -------- | -------------------------- | :------: |
| redirectUri | `string` | an authorized redirect URI |    ✓     |

#### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

### `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (code: string) => Promise<ProviderSession>;
```

#### Parameter

| name | type     | description                      |
| ---- | -------- | -------------------------------- |
| code | `string` | authorization code from callback |

#### Returns

| type                                                  | description       |
| ----------------------------------------------------- | ----------------- |
| [`ProviderSession`](/reference/oauth/providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

## `AppleTokens`

```ts
type AppleTokens = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	id_token: string;
};
```

## `AppleUser`

```ts
type AppleUser = {
	email: string;
	email_verified: boolean;
	sub: string;
};
```
