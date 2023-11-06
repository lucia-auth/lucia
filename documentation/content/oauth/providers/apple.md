---
title: "Apple OAuth provider"
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
import { auth } from "./lucia.js";

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
		scope?: string[];
		responseMode?: "query" | "form_post";
	}
) => AppleProvider;
```

##### Parameters

| name                  | type                                       | description                                                           | default   |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------- | --------- |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                                        |           |
| `config.clientId`     | `string`                                   | Apple service identifier                                              |           |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI                                            |           |
| `config.teamId`       | `string`                                   | Apple teamId                                                          |           |
| `config.keyId `       | `string`                                   | Apple private keyId                                                   |           |
| `config.certificate`  | `string`                                   | p8 certificate as string [See how](#how-to-import-certificate)        |           |
| `config.scope`        | `string[]`                                 | an array of scopes                                                    | `[]`      |
| `config.responseMode` | `"query" \| "form_post"`                   | OIDC response mode - **must be `"form_post"` when requesting scopes** | `"query"` |

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

## Requesting scopes

When requesting scopes (`email` and `name`), the `options.responseMode` must be set to `"form_post"`. Unlike the default `"query"` response mode, \*\*Apple will send an `application/x-www-form-urlencoded` POST request. You can retrieve the code by parsing the search queries or the form data.

```ts
post("/login/apple/callback", async (request) => {
	const url = new URL(request.url)
	const code = url.searchParams.get("code");
	if (!isValidState(request, code)) {
		// ...
	}
	const appleUserAuth = await
	// ...
})
```

Apple will also include a `user` field **only in the first response**, where you can access the user's name.

```ts
const url = new URL(request.url);
const userJSON = url.searchParams.get("user");
if (userJSON) {
	const user = JSON.parse(userJSON);
	const { firstName, lastName, email } = user;
}
```

## Interfaces

### `AppleAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<AppleAuth<_Auth>>
interface AppleAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<AppleUserAuth<_Auth>>;
}
```

| type                              |
| --------------------------------- |
| [`AppleUserAuth`](#appleuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

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
	email?: string;
	email_verified?: boolean;
	sub: string;
};
```

### `AppleUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface AppleUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	appleUser: AppleUser;
	appleTokens: AppleTokens;
}
```

| properties    | type                          | description       |
| ------------- | ----------------------------- | ----------------- |
| `appleUser`   | [`AppleUser`](#appleuser)     | Apple user        |
| `appleTokens` | [`AppleTokens`](#appletokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
