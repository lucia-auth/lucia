---
_order: 0
title: "Google"
description: "Learn about using the Google provider in Lucia OAuth integration"
---

OAuth integration for Google. Refer to [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server#httprests) for getting the required credentials. Provider id is `google`.

```ts
import { google } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { google } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const googleAuth = google(auth, configs);
```

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
) => OAuthProvider<GoogleUser, GoogleTokens>;
```

#### Parameter

| name                 | type                                 | description                                                                     | optional | default  |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------------------- | :------: | :------: |
| auth                 | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                                                  |          |          |
| configs.clientId     | `string`                             | Google OAuth app client id                                                      |          |          |
| configs.clientSecret | `string`                             | Google OAuth app client secret                                                  |          |          |
| configs.redirectUri  | `string`                             | an authorized redirect URI                                                      |          |          |
| configs.scope        | `string[]`                           | an array of scopes                                                              |    ✓     |          |
| configs.accessType   | `"online" \| "offline"`              | Google OAuth Access type ("online" (default) or "offline" (gets refresh_token)) |    ✓     | "online" |

#### Returns

| type                                              | description     |
| ------------------------------------------------- | --------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | Google provider |

## `GoogleProvider`

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

## `GoogleTokens`

```ts
type GoogleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: string;
};
```

## `GoogleUser`

```ts
type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
	hd: string;
};
```
