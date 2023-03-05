---
_order: 0
title: "Github"
---

OAuth integration for Github. Refer to [Github OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps) for getting the required credentials. Provider id is `github`.

```ts
import { github } from "@lucia-auth/oauth/providers";
```

### Initialization

```ts
import { github } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const githubAuth = github(auth, config);
```

```ts
const github: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		scope?: string[];
	}
) => OAuthProvider;
```

#### Parameter

| name                | type                                        | description                    | optional |
| ------------------- | ------------------------------------------- | ------------------------------ | -------- |
| auth                | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                 |          |
| config.clientId     | `string`                                    | Github OAuth app client id     |          |
| config.clientSecret | `string`                                    | Github OAuth app client secret |          |
| config.scope        | `string[]`                                  | an array of scopes             | true     |

#### Returns

| type                | description     |
| ------------------- | --------------- |
| [`OAuthProvider`](/oauth/reference/provider-api#oauthprovider) | Github provider |

## `GithubTokens`

```ts
type GithubTokens = {
	accessToken: string;
};
```

## `GithubUser`

```ts
type GithubUser = {
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
};
```
