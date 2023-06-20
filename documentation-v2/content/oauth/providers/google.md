---
order:: 0
title: "Google"
description: "Learn about using the Google provider in Lucia OAuth integration"
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

| name                 | type                    | description                                                                     | optional | default  |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------- | :------: | :------: |
| auth                 | [`Auth`]()              | Lucia instance                                                                  |          |          |
| configs.clientId     | `string`                | Google OAuth app client id                                                      |          |          |
| configs.clientSecret | `string`                | Google OAuth app client secret                                                  |          |          |
| configs.redirectUri  | `string`                | an authorized redirect URI                                                      |          |          |
| configs.scope        | `string[]`              | an array of scopes                                                              |    ✓     |          |
| configs.accessType   | `"online" \| "offline"` | Google OAuth Access type ("online" (default) or "offline" (gets refresh_token)) |    ✓     | "online" |

##### Returns

| type                 | description     |
| -------------------- | --------------- |
| [`GoogleProvider`]() | Google provider |

## Interfaces

### `GoogleProvider`

Satisfies [`OAuthProvider`]().

```ts
type GoogleProvider = OAuthProvider<GoogleUser, GoogleTokens>;
```

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
const validateCallback: (code: string) => Promise<GoogleUserAuth>;
```

##### Parameters

| name | type     | description                          |
| ---- | -------- | ------------------------------------ |
| code | `string` | The authorization code from callback |

##### Returns

| type                 |
| -------------------- |
| [`GoogleUserAuth`]() |

##### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

### `GoogleUserAuth`

```ts
type GoogleUserAuth = ProviderUserAuth & {
	googleUser: GoogleUser;
	googleTokens: GoogleTokens;
};
```

| type                   |
| ---------------------- |
| [`ProviderUserAuth`]() |
| [`GoogleUser`]()       |
| [`GoogleTokens`]()     |

### `GoogleTokens`

```ts
type GoogleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: string;
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
	email: string;
	email_verified: boolean;
	locale: string;
	hd: string;
};
```