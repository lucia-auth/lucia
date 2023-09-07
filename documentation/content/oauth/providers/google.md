---
title: "Google OAuth provider"
description: "Learn how to use the Google OAuth provider"
---

OAuth integration for Google. Refer to [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server#httprests) for getting the required credentials. Provider id is `google`.

```ts
import { google } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const googleAuth = google(auth, configs);
```

## `google()`

```ts
const google: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		accessType?: "online" | "offline";
	}
) => GoogleProvider;
```

##### Parameters

| name                   | type                                       | description                              | optional | default    |
| ---------------------- | ------------------------------------------ | ---------------------------------------- | :------: | ---------- |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                           |          |            |
| `configs.clientId`     | `string`                                   | Google OAuth app client id               |          |            |
| `configs.clientSecret` | `string`                                   | Google OAuth app client secret           |          |            |
| `configs.redirectUri`  | `string`                                   | an authorized redirect URI               |          |            |
| `configs.scope`        | `string[]`                                 | an array of scopes                       |    ✓     |            |
| `configs.accessType`   | `"online" \| "offline"`                    | set to `"offline"` to get refresh tokens |    ✓     | `"online"` |

##### Returns

| type                                | description     |
| ----------------------------------- | --------------- |
| [`GoogleProvider`](#googleprovider) | Google provider |

## Interfaces

### `GoogleAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<GoogleAuth<_Auth>>
interface GoogleAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<GoogleUserAuth<_Auth>>;
}
```

| type                                |
| ----------------------------------- |
| [`GoogleUserAuth`](#googleuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `GoogleTokens`

```ts
type GoogleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
};
```

### `GoogleUser`

```ts
type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
	email?: string;
	email_verified?: boolean;
	hd?: string;
};
```

### `GoogleUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface GoogleUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	googleUser: GoogleUser;
	googleTokens: GoogleTokens;
}
```

| properties     | type                            | description       |
| -------------- | ------------------------------- | ----------------- |
| `googleUser`   | [`GoogleUser`](#googleuser)     | Google user       |
| `googleTokens` | [`GoogleTokens`](#googletokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
