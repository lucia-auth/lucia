---
title: "Salesforce"
description: "Learn how to use the Salesforce OAuth provider"
---

OAuth 2.0 (Authorization code) integration for Salesforce. Provider id is `salesforce`.

```ts
import { salesforce } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const salesforceAuth = salesforce(auth, configs);
```

## `salesforce()`

Scopes `oidc`, `profile`, and `id` are always included.

```ts
const salesforce: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => SalesforceProvider;
```

##### Parameters

| name                   | type                                       | description                        | optional |
| ---------------------- | ------------------------------------------ | ---------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                     |          |
| `configs.clientId`     | `string`                                   | Salesforce OAuth app client id     |          |
| `configs.clientSecret` | `string`                                   | Salesforce OAuth app client secret |          |
| `configs.redirectUri`  | `string`                                   | an authorized redirect URI         |          |
| `configs.scope`        | `string[]`                                 | an array of scopes                 |    ✓     |

##### Returns

| type                                        | description         |
| ------------------------------------------- | ------------------- |
| [`SalesforceProvider`](#salesforceprovider) | Salesforce provider |

## Interfaces

### `SalesforceAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<SalesforceAuth<_Auth>>
interface SalesforceAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<SalesforceUserAuth<_Auth>>;
}
```

| type                                        |
| ------------------------------------------- |
| [`SalesforceUserAuth`](#salesforceuserauth) |

##### Generics

| name    | extends    | default |
| ------- | ---------- | ------- |
| `_Auth` | [`Auth`]() | `Auth`  |

### `SalesforceTokens`

```ts
type SalesforceTokens = {
	accessToken: string;
	idToken: string;
	refreshToken: string | null;
};
```

### `SalesforceUser`

```ts
type SalesforceUser = {
	sub: string; // URL
	user_id: string;
	organization_id: string;
	name: string;
	email?: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	zoneinfo: string;
	photos: {
		picture: string;
		thumbnail: string;
	};
	profile: string;
	picture: string;
	address?: Record<string, string>;
	urls: Record<string, string>;
	active: boolean;
	user_type: string;
	language: string;
	locale: string;
	utcOffset: number;
	updated_at: string;
};
```

### `SalesforceUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	salesforceUser: SalesforceUser;
	salesforceTokens: SalesforceTokens;
}
```

| properties         | type                                    | description       |
| ------------------ | --------------------------------------- | ----------------- |
| `salesforceUser`   | [`SalesforceUser`](#salesforceuser)     | Salesforce user   |
| `salesforceTokens` | [`SalesforceTokens`](#salesforcetokens) | Access tokens etc |

##### Generics

| name    | extends    |
| ------- | ---------- |
| `_Auth` | [`Auth`]() |
