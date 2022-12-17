---
order: 0
title: "Google"
---

OAuth integration for Google. Refer to [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server#httprests) for getting the required credentials.

### Initialization

```ts
import google from "@lucia-auth/oauth/google";
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
	}
) => GoogleProvider;
```

#### Parameter

| name                 | type                                        | description                         | optional |
| -------------------- | ------------------------------------------- | ----------------------------------- | -------- |
| auth                 | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                      |          |
| configs.clientId     | `string`                                    | Google OAuth app client id          |          |
| configs.clientSecret | `string`                                    | Google OAuth app client secret      |          |
| configs.redirectUri  | `string`                                    | one of the authorized redirect URIs |          |
| configs.scope        | `string[]`                                  | an array of scopes                  | true     |

### Redirect user to authorization url

Redirect the user to Google's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import google from "@lucia-auth/oauth/google";
import { auth } from "./lucia.js";

const googleAuth = google(auth, configs);

const [authorizationUrl, state] = googleAuth.getAuthorizationUrl();

// the state can be stored in cookies or localstorage for request validation on callback
setCookie("state", state, {
	path: "/",
	httpOnly: true, // only readable in the server
	maxAge: 60 * 60 // a reasonable expiration date
}); // example with cookie
```

### Validate callback

The authorization code and state can be retrieved from the `code` and `state` search params, respectively, inside the callback url. Validate that the state is the same as the one stored in either cookies or localstorage before passing the `code` to `validateCallback()`.

```ts
import google from "@lucia-auth/oauth/google";

const googleAuth = google(auth, configs);

// get code and state from search params
const url = new URL(callbackUrl);
const code = url.searchParams.get("code") || ""; // http://localhost:3000/api/google?code=abc&state=efg => abc
const state = url.searchParams.get("state") || ""; // http://localhost:3000/api/google?code=abc&state=efg => efg

// get state stored in cookie (refer to previous step)
const storedState = headers.cookie.get("state");

// validate state
if (state !== storedState) throw new Error(); // invalid state

const googleSession = await googleAuth.validateCallback(code);
```

## `google()` (default)

Refer to [`Initialization`](/oauth/providers/google#initialization).

## `GoogleProvider`

```ts
interface GoogleProvider {
	getAuthorizationUrl: <State = string | null | undefined = undefined>(state?: State) => State extends null ? [url: string] : [url: string, state: string]
	validateCallback: (code: string) => Promise<GoogleProviderSession>;
}
```

Implements [`OAuthProvider`](/oauth/reference/api-reference#oauthprovider).

### `getAuthorizationUrl()`

Refer to [`OAuthProvider.getAuthorizationUrl()`](/oauth/reference/api-reference#getauthorizationurl).

### `validateCallback()`

Implements [`OAuthProvider.validateCallback()`](/oauth/reference/api-reference#getauthorizationurl). `code` can be acquired from the `code` search params inside the callback url.

```ts
const validateCallback: (code: string) => Promise<GoogleProviderSession>;
```

#### Returns

| type                                                                     |
| ------------------------------------------------------------------------ |
| [`GoogleProviderSession`](/oauth/providers/google#googleprovidersession) |

## `GoogleProviderSession`

```ts
interface GoogleProviderSession {
	existingUser: User | null;
	createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
	providerUser: GoogleUser;
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}
```

Implements [`ProviderSession`](/oauth/reference/api-reference#providersession).

| name                                             | type                                                  | description                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| existingUser                                     | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createUser](/oauth/providers/google#createuser) | `Function`                                            |                                                   |
| providerUser                                     | [`GoogleUser`](/oauth/providers/google#googleuser)    | Google user                                       |
| accessToken                                      | `string`                                              | Google access token                               |
| refreshToken                                     | `string \| undefined`                                 | only defined on the first sign in                 |
| expires in                                       | `number`                                              | expiration time (seconds) of the access token     |

### `createUser()`

```ts
const createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
```

Creates a new using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name               | value                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| provider           | `"google"`                                                               |
| identifier         | Google "sub" id ([`GoogleUser.sub`](/oauth/providers/google#googleuser)) |
| options.attributes | `userAttributes`                                                         |

## `GoogleUser`

```ts
interface GoogleUser {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
	hd: string;
}
```
