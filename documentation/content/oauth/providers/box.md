---
title: "Box OAuth provider"
description: "Learn how to use the Box OAuth provider"
---

OAuth integration for Box. Provider id is `box`.

```ts
import { box } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const boxAuth = box(auth, configs);
```

## `box()`

```ts
const box: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
	}
) => BoxProvider;
```

##### Parameters

| name                  | type                                       | description                 |
| --------------------- | ------------------------------------------ | --------------------------- |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance              |
| `config.clientId`     | `string`                                   | Box OAuth app client id     |
| `config.clientSecret` | `string`                                   | Box OAuth app client secret |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI  |

##### Returns

| type                          | description  |
| ----------------------------- | ------------ |
| [`BoxProvider`](#boxprovider) | Box provider |

## Interfaces

### `BoxAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<BoxAuth<_Auth>>
interface BoxAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<BoxUserAuth<_Auth>>;
}
```

| type                          |
| ----------------------------- |
| [`BoxUserAuth`](#boxuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `BoxTokens`

```ts
type BoxTokens = {
	accessToken: string;
};
```

### `BoxUser`

```ts
type BoxUser = {
	id: string;
	type: "user";
	address: string;
	avatar_url: string;
	can_see_managed_users: boolean;
	created_at: string;
	enterprise: {
		id: string;
		type: string;
		name: string;
	};
	external_app_user_id: string;
	hostname: string;
	is_exempt_from_device_limits: boolean;
	is_exempt_from_login_verification: boolean;
	is_external_collab_restricted: boolean;
	is_platform_access_only: boolean;
	is_sync_enabled: boolean;
	job_title: string;
	language: string;
	login: string;
	max_upload_size: number;
	modified_at: string;
	my_tags: [string];
	name: string;
	notification_email: {
		email: string;
		is_confirmed: boolean;
	};
	phone: string;
	role: string;
	space_amount: number;
	space_used: number;
	status:
		| "active"
		| "inactive"
		| "cannot_delete_edit"
		| "cannot_delete_edit_upload";
	timezone: string;
	tracking_codes: {
		type: string;
		name: string;
		value: string;
	}[];
};
```

### `BoxUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface BoxUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	boxUser: BoxUser;
	boxTokens: BoxTokens;
}
```

| properties  | type                      | description       |
| ----------- | ------------------------- | ----------------- |
| `boxUser`   | [`BoxUser`](#boxuser)     | Box user          |
| `boxTokens` | [`BoxTokens`](#boxtokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
