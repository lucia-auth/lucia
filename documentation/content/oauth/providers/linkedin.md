---
_order: 0
title: "LinkedIn"
description: "Learn about using the LinkedIn provider in Lucia OAuth integration"
---

OAuth integration for LinkedIn. Refer to [LinkedIn OAuth documentation](https:/.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS1) for getting the required credentials. Provider id is `linkedin`.

```ts
import { linkedin } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { linkedin } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const linkedinAuth = linkedin(auth, config);
```

```ts
const linkedin: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => OAuthProvider<LinkedInUser, LinkedInTokens>;
```

#### Parameter

| name                | type                                 | description                                             | optional |
| ------------------- | ------------------------------------ | ------------------------------------------------------- | :------: |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                          |          |
| config.clientId     | `string`                             | LinkedIn OAuth app client id                            |          |
| config.clientSecret | `string`                             | LinkedIn OAuth app client secret                        |          |
| config.redirectUri  | `string`                             | LinkedIn OAuth app redirect uri                         |          |
| config.scope        | `string[]`                           | an array of scopes - `r_liteprofile` is always included |    ✓     |

#### Returns

| type                                              | description       |
| ------------------------------------------------- | ----------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | LinkedIn provider |

## `LinkedInProvider`

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

## `LinkedInTokens`

```ts
type LinkedInTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};
```

## `LinkedInUser`

```ts
type LinkedInUser = {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture?: string;
};
```
