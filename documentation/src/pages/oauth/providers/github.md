---
order: 0
layout: "@layouts/DocumentLayout.astro"
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

| name                 | type                                        | description                    |
| -------------------- | ------------------------------------------- | ------------------------------ |
| auth                 | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                 |
| configs.clientId     | `string`                                    | Github OAuth app client id     |
| configs.clientSecret | `string`                                    | Github OAuth app client secret |
| configs.scope        | `string[]`                                  | an array of scopes             |

### Redirect user to authorization url

Redirect the user to Github's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import github from "@lucia-auth/oauth/github";
import { auth } from "./lucia.js";

const githubAuth = github(auth, configs);

const authorizationUrl = githubAuth.getAuthorizationUrl();
```

### Validate callback

The authorization code can be retrieved from the `code` search params inside the callback url.

```ts
import github from "@lucia-auth/oauth/github";
const githubAuth = github();

const code = new URL(callbackUrl).searchParams.get("code") || ""; // http://localhost:3000/api/github?code=abc => abc
const githubSession = await githubAuth.validateCallback(code);
```

## `github()` (default)

Refer to [`Initialization`](/oauth/providers/github#initialization).

## `GithubProvider`

```ts
interface GithubProvider {
	getAuthorizationUrl: () => string;
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
	createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
	providerUser: GithubUser;
	accessToken: string;
}
```

Implements [`ProviderSession`](/oauth/reference/api-reference#providersession).

| name                                             | type                                                  | description                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| existingUser                                     | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createUser](/oauth/providers/github#createuser) | `Function`                                            |                                                   |
| providerUser                                     | [`GithubUser`](/oauth/providers/github#githubuser)    | Github user                                       |
| accessToken                                      | `string`                                              | Github access token                               |

### `createUser()`

```ts
const createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
```

Creates a new using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name               | value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| provider           | `"github"`                                                             |
| identifier         | Github user id ([`GithubUser.id`](/oauth/providers/github#githubuser)) |
| options.attributes | `userAttributes`                                                       |

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
