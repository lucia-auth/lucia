---
order:: 0
title: "Github"
description: "Learn about using the Github provider in Lucia OAuth integration"
---

OAuth integration for Github. Refer to [Github OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps) for getting the required credentials. Provider id is `github`.

```ts
import { github } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const githubAuth = github(auth, config);
```

## `github()`

```ts
const github: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		scope?: string[];
		redirectUri?: string;
	}
) => GithubProvider;
```

##### Parameters

| name                  | type                                       | description                    | optional |
| --------------------- | ------------------------------------------ | ------------------------------ | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                 |          |
| `config.clientId`     | `string`                                   | Github OAuth app client id     |          |
| `config.clientSecret` | `string`                                   | Github OAuth app client secret |          |
| `config.scope`        | `string[]`                                 | an array of scopes             |    ✓     |
| `configs.redirectUri` | `string`                                   | an authorized redirect URI     |    ✓     |

##### Returns

| type                                | description     |
| ----------------------------------- | --------------- |
| [`GithubProvider`](#githubprovider) | Github provider |

## Interfaces

### `GithubProvider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

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
const validateCallback: (code: string) => Promise<GithubUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                                |
| ----------------------------------- |
| [`GithubUserAuth`](#githubuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `GithubUserAuth`

```ts
type GithubUserAuth = ProviderUserAuth & {
	githubUser: GithubUser;
	githubTokens: GithubTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`GithubUser`](#githubuser)                                        |
| [`GithubTokens`](#githubtokens)                                    |

### `GithubTokens`

```ts
type GithubTokens =
	| {
			accessToken: string;
			accessTokenExpiresIn: null;
	  }
	| {
			accessToken: string;
			accessTokenExpiresIn: number;
			refreshToken: string;
			refreshTokenExpiresIn: number;
	  };
```

### `GithubUser`

```ts
type GithubUser = PublicGithubUser | PrivateGithubUser;
```

```ts
type PublicGithubUser = {
	avatar_url: string;
	bio: string | null;
	blog: string | null;
	company: string | null;
	created_at: string;
	email: string | null;
	events_url: string;
	followers: number;
	followers_url: string;
	following: number;
	following_url: string;
	gists_url: string;
	gravatar_id: string | null;
	hireable: boolean | null;
	html_url: string;
	id: number;
	location: string | null;
	login: string;
	name: string | null;
	node_id: string;
	organizations_url: string;
	public_gists: number;
	public_repos: number;
	received_events_url: string;
	repos_url: string;
	site_admin: boolean;
	starred_url: string;
	subscriptions_url: string;
	type: string;
	updated_at: string;
	url: string;

	twitter_username?: string | null;
	plan?: {
		name: string;
		space: number;
		private_repos: number;
		collaborators: number;
	};
	suspended_at?: string | null;
};

type PrivateGithubUser = PublicGithubUser & {
	collaborators: number;
	disk_usage: number;
	owned_private_repos: number;
	private_gists: number;
	total_private_repos: number;
	two_factor_authentication: boolean;

	business_plus?: boolean;
	ldap_dn?: string;
};
```
