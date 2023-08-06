---
title: "Apple"
description: "Learn how to use the Apple OAuth provider"
---

**Before starting make sure you have an paid apple dev account.**

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
import { auth } from "./auth.js";

const appleAuth = apple(auth, configs);
```

## `apple()`

```ts
const apple: (
	auth: Auth,
	config: {
		clientId: string;
		redirectUri: string;
		teamId: string;
		keyId: string;
		certificate: string;
	}
) => AppleProvider;
```

##### Parameters

| name               | type                                       | description                                                    |
| ------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| `auth`             | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                                 |
| config.clientId    | `string`                                   | Apple service identifier                                       |
| config.redirectUri | `string`                                   | an authorized redirect URI                                     |
| config.teamId      | `string`                                   | Apple teamId                                                   |
| config.keyId       | `string`                                   | Apple private keyId                                            |
| config.certificate | `string`                                   | p8 certificate as string [See how](#how-to-import-certificate) |

##### Returns

| type                              | description    |
| --------------------------------- | -------------- |
| [`AppleProvider`](#appleprovider) | Apple provider |

### Import certificate

Example using Node.js:

```ts
import fs from "fs";
import path from "path";

const certificatePath = path.join(
	process.cwd(),
	process.env.APPLE_CERT_PATH ?? ""
);

const certificate = fs.readFileSync(certificatePath, "utf-8");

export const appleAuth = apple(auth, {
	teamId: process.env.APPLE_TEAM_ID ?? "",
	keyId: process.env.APPLE_KEY_ID ?? "",
	certificate: certificate,
	redirectUri: process.env.APPLE_REDIRECT_URI ?? "",
	clientId: process.env.APPLE_CLIENT_ID ?? ""
});
```

## Interfaces

### `AppleProvider`

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
const validateCallback: (code: string) => Promise<AppleUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                              |
| --------------------------------- |
| [`AppleUserAuth`](#appleuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `AppleUserAuth`

```ts
type Auth0UserAuth = ProviderUserAuth & {
	appleUser: AppleUser;
	appleTokens: AppleTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`AppleUser`](#appleuser)                                          |
| [`AppleTokens`](#appletokens)                                      |

### `AppleTokens`

```ts
type AppleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
	idToken: string;
};
```

### `AppleUser`

```ts
type AppleUser = {
	email: string;
	email_verified: boolean;
	sub: string;
};
```
