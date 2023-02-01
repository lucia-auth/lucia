---
_order: 0
title: "Github"
---

OAuth integration for Github. Refer to [Github OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps) for getting the required credentials.

### Initialization

```ts
import github from "@lucia-auth/oauth/github";
import { auth } from "./lucia.js";

const githubAuth = github(auth, configs);
```

```ts
const github: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		scope?: string[];
	}
) => GithubProvider;
```

#### Parameter

| name                 | type                                        | description                    | optional |
| -------------------- | ------------------------------------------- | ------------------------------ | -------- |
| auth                 | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                 |          |
| configs.clientId     | `string`                                    | Github OAuth app client id     |          |
| configs.clientSecret | `string`                                    | Github OAuth app client secret |          |
| configs.scope        | `string[]`                                  | an array of scopes             | true     |

### Redirect user to authorization url

Redirect the user to Github's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import github from "@lucia-auth/oauth/github";
import { auth } from "./lucia.js";

const githubAuth = github(auth, configs);

const [authorizationUrl, state] = githubAuth.getAuthorizationUrl();

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
import github from "@lucia-auth/oauth/github";
const githubAuth = github();

// get code and state from search params
const url = new URL(callbackUrl);
const code = url.searchParams.get("code") || ""; // http://localhost:3000/api/github?code=abc&state=efg => abc
const state = url.searchParams.get("state") || ""; // http://localhost:3000/api/github?code=abc&state=efg => efg

// get state stored in cookie (refer to previous step)
const storedState = headers.cookie.get("state");

// validate state
if (state !== storedState) throw new Error(); // invalid state

const githubSession = await githubAuth.validateCallback(code);
```

## `github()` (default)

Refer to [`Initialization`](/oauth/providers/github#initialization).

## `GithubProvider`

```ts
interface GithubProvider {
	getAuthorizationUrl: <State = string | null | undefined = undefined>(state?: State) => State extends null ? [url: string] : [url: string, state: string];
	validateCallback: (code: string) => Promise<GithubProviderSession>;
}
```

Implements [`OAuthProvider`](/oauth/reference/api-reference#oauthprovider).

### `getAuthorizationUrl()`

Refer to [`OAuthProvider.getAuthorizationUrl()`](/oauth/reference/api-reference#getauthorizationurl).

### `validateCallback()`

Implements [`OAuthProvider.validateCallback()`](/oauth/reference/api-reference#getauthorizationurl). `code` can be acquired from the `code` search params inside the callback url.

```ts
const validateCallback: (code: string) => Promise<GithubProviderSession>;
```

#### Returns

| type                                                                     |
| ------------------------------------------------------------------------ |
| [`GithubProviderSession`](/oauth/providers/github#githubprovidersession) |

## `GithubProviderSession`

```ts
interface GithubProviderSession {
	existingUser: User | null;
	createKey: (userId: string) => Promise<Key>;
	createUser: (userAttributes: Lucia.UserAttributes) => Promise<User>;
	providerUser: GithubUser;
	accessToken: string;
}
```

Implements [`ProviderSession`](/oauth/reference/api-reference#providersession).

| name                                             | type                                                  | description                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| existingUser                                     | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createKey](/oauth/providers/github#createkey)   | `Function`                                            |                                                   |
| [createUser](/oauth/providers/github#createuser) | `Function`                                            |                                                   |
| providerUser                                     | [`GithubUser`](/oauth/providers/github#githubuser)    | Github user                                       |
| accessToken                                      | `string`                                              | Github access token                               |

### `createKey()`

```ts
const createKey: (userId: string) => Promise<Key>;
```

Creates a new key using [`Lucia.createKey()`](/reference/api/server-api#createkey) using the following parameter:

| name           | value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| userId         | `userId`                                                               |
| providerId     | `"github"`                                                             |
| providerUserId | Github user id ([`GithubUser.id`](/oauth/providers/github#githubuser)) |

### `createUser()`

```ts
const createUser: (userAttributes: Lucia.UserAttributes) => Promise<User>;
```

Creates a new user using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name                    | value                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| data.key.providerId     | `"github"`                                                             |
| data.key.providerUserId | Github user id ([`GithubUser.id`](/oauth/providers/github#githubuser)) |
| data.attributes         | `userAttributes`                                                       |

## `GithubUser`

```ts
interface GithubUser {
	login: string; // username
	id: number; // user id
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string;
	company: string;
	blog: string;
	location: string;
	email: string;
	hireable: boolean;
	bio: string;
	twitter_username: string;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
	private_gists?: number;
	total_private_repos?: number;
	owned_private_repos?: number;
	disk_usage?: number;
	collaborators?: number;
	two_factor_authentication?: boolean;
	plan?: {
		name: string;
		space: number;
		private_repos: number;
		collaborators: number;
	};
}
```
