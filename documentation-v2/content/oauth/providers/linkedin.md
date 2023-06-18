---
order:: 0
title: "LinkedIn"
description: "Learn about using the LinkedIn provider in Lucia OAuth integration"
---

OAuth integration for LinkedIn. Refer to [LinkedIn OAuth documentation](https:/.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS1) for getting the required credentials. Provider id is `linkedin`.

```ts
import { linkedIn } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const linkedInAuth = linkedIn(auth, config);
```

## `linkedIn()`

```ts
const linkedIn: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => LinkedInProvider;
```

##### Parameters

| name                | type       | description                                             | optional |
| ------------------- | ---------- | ------------------------------------------------------- | :------: |
| auth                | [`Auth`]() | Lucia instance                                          |          |
| config.clientId     | `string`   | LinkedIn OAuth app client id                            |          |
| config.clientSecret | `string`   | LinkedIn OAuth app client secret                        |          |
| config.redirectUri  | `string`   | LinkedIn OAuth app redirect uri                         |          |
| config.scope        | `string[]` | an array of scopes - `r_liteprofile` is always included |    ✓     |

##### Returns

| type                   | description       |
| ---------------------- | ----------------- |
| [`LinkedInProvider`]() | LinkedIn provider |

## Interfaces

### `LinkedInProvider`

Satisfies [`OAuthProvider`]().

```ts
type LinkedInProvider = OAuthProvider<LinkedInUser, LinkedInTokens>;
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
const validateCallback: (code: string) => Promise<LinkedInUserAuth>;
```

##### Parameters

| name | type     | description                          |
| ---- | -------- | ------------------------------------ |
| code | `string` | The authorization code from callback |

##### Returns

| type                   |
| ---------------------- |
| [`LinkedInUserAuth`]() |

##### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

### `LinkedInUserAuth`

```ts
type LinkedInUserAuth = ProviderUserAuth & {
	linkedInUser: LinkedInUser;
	linkedInTokens: LinkedInTokens;
};
```

| type                   |
| ---------------------- |
| [`ProviderUserAuth`]() |
| [`LinkedInUser`]()     |
| [`LinkedInTokens`]()   |

### `LinkedInTokens`

```ts
type LinkedInTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};
```

### `LinkedInUser`

```ts
type LinkedInUser = {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture?: string;
};
```
