---
title: "Slack OAuth provider"
description: "Learn how to use the Salck OAuth provider"
---

OAuth integration for Slack. Provider id is `slack`.

```ts
import { slack } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const slackAuth = slack(auth, configs);
```

## `slack()`

Scopes `openid` and `profile` are always included.

```ts
const slack: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => SlackProvider;
```

##### Parameters

| name                  | type                                       | description                                | optional |
| --------------------- | ------------------------------------------ | ------------------------------------------ | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                             |          |
| `config.clientId`     | `string`                                   | Slack OAuth app client id                  |          |
| `config.clientSecret` | `string`                                   | Slack OAuth app client secret              |          |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI (must be HTTPS) |          |
| `config.scope`        | `string[]`                                 | an array of scopes                         |    ✓     |

##### Returns

| type                              | description    |
| --------------------------------- | -------------- |
| [`SlackProvider`](#slackprovider) | Slack provider |

## Interfaces

### `SlackAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<SlackAuth<_Auth>>
interface SlackAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<SlackUserAuth<_Auth>>;
}
```

| type                              |
| --------------------------------- |
| [`SlackUserAuth`](#slackuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `SlackTokens`

```ts
type SlackTokens = {
	accessToken: string;
	idToken: string;
};
```

### `SlackUser`

```ts
type SlackUser = {
	sub: string;
	"https://slack.com/user_id": string;
	"https://slack.com/team_id": string;
	email?: string;
	email_verified: boolean;
	date_email_verified: number;
	name: string;
	picture: string;
	given_name: string;
	family_name: string;
	locale: string;
	"https://slack.com/team_name": string;
	"https://slack.com/team_domain": string;
	"https://slack.com/user_image_24": string;
	"https://slack.com/user_image_32": string;
	"https://slack.com/user_image_48": string;
	"https://slack.com/user_image_72": string;
	"https://slack.com/user_image_192": string;
	"https://slack.com/user_image_512": string;
	"https://slack.com/team_image_34": string;
	"https://slack.com/team_image_44": string;
	"https://slack.com/team_image_68": string;
	"https://slack.com/team_image_88": string;
	"https://slack.com/team_image_102": string;
	"https://slack.com/team_image_132": string;
	"https://slack.com/team_image_230": string;
	"https://slack.com/team_image_default": true;
};
```

### `SlackUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface SlackUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	slackUser: SlackUser;
	slackTokens: SlackTokens;
}
```

| properties    | type                          | description       |
| ------------- | ----------------------------- | ----------------- |
| `slackUser`   | [`SlackUser`](#slackuser)     | Slack user        |
| `slackTokens` | [`SlackTokens`](#slacktokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
