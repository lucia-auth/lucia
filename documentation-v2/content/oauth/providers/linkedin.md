---
order: 0
title: "Linkedin"
description: "Learn about using the Linkedin provider in Lucia OAuth integration"
---

OAuth integration for Linkedin. Refer to [Linkedin OAuth documentation](https:/.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS1) for getting the required credentials. Provider id is `linkedin`.

```ts
import { linkedin } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const linkedinAuth = linkedin(auth, config);
```

## `linkedin()`

```ts
const linkedin: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => LinkedinProvider;
```

##### Parameters

| name                  | type                                       | description                                             | optional |
| --------------------- | ------------------------------------------ | ------------------------------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                          |          |
| `config.clientId`     | `string`                                   | Linkedin OAuth app client id                            |          |
| `config.clientSecret` | `string`                                   | Linkedin OAuth app client secret                        |          |
| `config.redirectUri`  | `string`                                   | Linkedin OAuth app redirect uri                         |          |
| `config.scope`        | `string[]`                                 | an array of scopes - `r_liteprofile` is always included |    ✓     |

##### Returns

| type                                    | description       |
| --------------------------------------- | ----------------- |
| [`LinkedinProvider`](#linkedinprovider) | Linkedin provider |

## Interfaces

### `LinkedinProvider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

```ts
type LinkedinProvider = OAuthProvider<LinkedinUser, LinkedinTokens>;
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
const validateCallback: (code: string) => Promise<LinkedinUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                    |
| --------------------------------------- |
| [`LinkedinUserAuth`](#linkedinuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `LinkedinUserAuth`

```ts
type LinkedinUserAuth = ProviderUserAuth & {
	linkedinUser: LinkedinUser;
	linkedinTokens: LinkedinTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`LinkedinUser`](#linkedinuser)                                    |
| [`LinkedinTokens`](#linkedintokens)                                |

### `LinkedinTokens`

```ts
type LinkedinTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};
```

### `LinkedinUser`

```ts
type LinkedinUser = {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture?: string;
};
```
