---
title: "Github OAuth provider"
description: "Learn how to use the Github OAuth provider"
---

OAuth integration for Github. Refer to [Create a Github OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) for getting the required credentials. Provider id is `github`.

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

### `GithubAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<GithubAuth<_Auth>>
interface GithubAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<GithubUserAuth<_Auth>>;
}
```

| type                                |
| ----------------------------------- |
| [`GithubUserAuth`](#githubuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

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

### `GithubUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface GithubUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	githubUser: GithubUser;
	githubTokens: GithubTokens;
}
```

| properties     | type                            | description       |
| -------------- | ------------------------------- | ----------------- |
| `githubUser`   | [`GithubUser`](#githubuser)     | Github user       |
| `githubTokens` | [`GithubTokens`](#githubtokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
