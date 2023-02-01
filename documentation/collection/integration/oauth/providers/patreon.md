---
_order: 0
title: "Patreon"
---

OAuth integration for Patreon. Refer to [Patreon OAuth documentation](https://docs.patreon.com/#clients-and-api-keys) for getting the required credentials.

### Initialization

```ts
import patreon from "@lucia-auth/oauth/patreon";
import { auth } from "./lucia.js";

const patreonAuth = patreon(auth, configs);
```

```ts
const patreon: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		allMemberships?: boolean;
	}
) => PatreonProvider;
```

#### Parameter

| name                   | type                                        | description                                                                                | optional |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| auth                   | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                                                                             |          |
| configs.clientId       | `string`                                    | Patreon OAuth app client id                                                                |          |
| configs.clientSecret   | `string`                                    | Patreon OAuth app client secret                                                            |          |
| configs.redirectUri    | `string`                                    | one of the authorized redirect URIs                                                        |          |
| configs.scope          | `string[]`                                  | an array of scopes                                                                         | true     |
| configs.allMemberships | `boolean`                                   | shorthand for scope "identity.memberships" which will reveal memberships for all campaigns | true     |

### Redirect user to authorization url

Redirect the user to Patreons's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import patreon from "@lucia-auth/oauth/patreon";
import { auth } from "./lucia.js";

const patreonAuth = patreon(auth, configs);

const [authorizationUrl, state] = patreonAuth.getAuthorizationUrl();

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
import patreon from "@lucia-auth/oauth/patreon";

const patreonAuth = patreon(auth, configs);

// get code and state from search params
const url = new URL(callbackUrl);
const code = url.searchParams.get("code") || ""; // http://localhost:3000/api/patreon?code=abc&state=efg => abc
const state = url.searchParams.get("state") || ""; // http://localhost:3000/api/patreon?code=abc&state=efg => efg

// get state stored in cookie (refer to previous step)
const storedState = headers.cookie.get("state");

// validate state
if (state !== storedState) throw new Error(); // invalid state

const patreonSession = await patreonAuth.validateCallback(code);
```

## `patreon()` (default)

Refer to [`Initialization`](/oauth/providers/patreon#initialization).

## `PatreonProvider`

```ts
interface PatreonProvider {
	getAuthorizationUrl: <State = string | null | undefined = undefined>(state?: State) => State extends null ? [url: string] : [url: string, state: string]
	validateCallback: (code: string) => Promise<PatreonProviderSession>;
}
```

Implements [`OAuthProvider`](/oauth/reference/api-reference#oauthprovider).

### `getAuthorizationUrl()`

Refer to [`OAuthProvider.getAuthorizationUrl()`](/oauth/reference/api-reference#getauthorizationurl).

### `validateCallback()`

Implements [`OAuthProvider.validateCallback()`](/oauth/reference/api-reference#getauthorizationurl). `code` can be acquired from the `code` search params inside the callback url.

```ts
const validateCallback: (code: string) => Promise<PatreonProviderSession>;
```

#### Returns

| type                                                                        |
| --------------------------------------------------------------------------- |
| [`PatreonProviderSession`](/oauth/providers/patreon#patreonprovidersession) |

## `PatreonProviderSession`

```ts
interface PatreonProviderSession {
	existingUser: User | null;
	createKey: (userId: string) => Promise<Key>;
	createUser: (userAttributes) => Promise<User>;
	providerUser: PatreonUser;
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}
```

Implements [`ProviderSession`](/oauth/reference/api-reference#providersession).

| name                                              | type                                                  | description                                       |
| ------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| existingUser                                      | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createKey](/oauth/providers/patreon#createkey)   | `Function`                                            |                                                   |
| [createUser](/oauth/providers/patreon#createuser) | `Function`                                            |                                                   |
| providerUser                                      | [`PatreonUser`](/oauth/providers/patreon#patreonuser) | Patreon user                                      |
| accessToken                                       | `string`                                              | Patreon access token                              |
| refreshToken                                      | `string \| undefined`                                 | only defined on the first sign in                 |
| expires in                                        | `number`                                              | expiration time (seconds) of the access token     |

### `createKey()`

```ts
const createKey: (userId: string) => Promise<Key>;
```

Creates a new key using [`Lucia.createKey()`](/reference/api/server-api#createkey) using the following parameter:

| name           | value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| userId         | `userId`                                                                        |
| providerId     | `"patreon"`                                                                     |
| providerUserId | Patreon user id ([`PatreonUser.data.id`](/oauth/providers/patreon#patreonuser)) |

### `createUser()`

```ts
const createUser: (userAttributes: Lucia.UserAttributes) => Promise<User>;
```

Creates a new user using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name                    | value                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| data.key.providerId     | `"patreon"`                                                                     |
| data.key.providerUserId | Patreon user id ([`PatreonUser.data.id`](/oauth/providers/patreon#patreonuser)) |
| data.attributes         | `userAttributes`                                                                |

## `PatreonUser`

```ts
interface PatreonUser {
	type: "user";
	attributes: {
		about: string | null;
		created: string;
		email: string;
		first_name: string | null;
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		last_name: string | null;
		url: string;
	};
	id: string;
	relationships: {
		memberships: PatreonMembership[];
	};
}
```

## `PatreonMembership`

```ts
interface PatreonMembership {
	type: "member";
	id: string;
	relationships: {
		campaign: PatreonCampaign;
		currently_entitled_tiers: PatreonTier[];
	};
}
```

## `PatreonCampaign`

```ts
interface PatreonCampaign {
	attributes: {
		vanity: string | null;
	};
	id: string;
	type: "campaign";
}
```

## `PatreonTier`

```ts
interface PatreonTier {
	attributes: {
		amount_cents: number;
		title: string;
	};
	id: string;
	type: "tier";
}
```
