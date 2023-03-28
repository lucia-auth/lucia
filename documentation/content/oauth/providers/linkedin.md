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
| ------------------- | ------------------------------------ | ------------------------------------------------------- | -------- |
| auth                | [`Auth`](/reference/lucia-auth/auth) | Lucia instance                                          |          |
| config.clientId     | `string`                             | LinkedIn OAuth app client id                            |          |
| config.clientSecret | `string`                             | LinkedIn OAuth app client secret                        |          |
| config.redirectUri  | `string`                             | LinkedIn OAuth app redirect uri                         |          |
| config.scope        | `string[]`                           | an array of scopes - `r_liteprofile` is always included | true     |

#### Returns

| type                                              | description       |
| ------------------------------------------------- | ----------------- |
| [`OAuthProvider`](/reference/oauth/oauthprovider) | LinkedIn provider |

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
