---
title: "Dropbox OAuth provider"
description: "Learn how to use the Dropbox OAuth provider"
---

OAuth integration for Dropbox. Provider id is `dropbox`.

```ts
import { dropbox } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const dropboxAuth = dropbox(auth, configs);
```

## `dropbox()`

Scope `account_info.read` is always included.

```ts
const dropbox: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
		tokenAccessType?: "online" | "offline";
	}
) => DropboxProvider;
```

##### Parameters

| name                      | type                                       | description                              | optional | default    |
| ------------------------- | ------------------------------------------ | ---------------------------------------- | :------: | ---------- |
| `auth`                    | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                           |          |            |
| `configs.clientId`        | `string`                                   | Dropbox OAuth app client id              |          |            |
| `configs.clientSecret`    | `string`                                   | Dropbox OAuth app client secret          |          |            |
| `configs.redirectUri`     | `string`                                   | an authorized redirect URI               |          |            |
| `configs.scope`           | `string[]`                                 | an array of scopes                       |    ✓     |            |
| `configs.tokenAccessType` | `"online" \| "offline"`                    | set to `"offline"` to get refresh tokens |    ✓     | `"online"` |

##### Returns

| type                                  | description      |
| ------------------------------------- | ---------------- |
| [`DropboxProvider`](#dropboxprovider) | Dropbox provider |

## Interfaces

### `DropboxAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<DropboxAuth<_Auth>>
interface DropboxAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<DropboxUserAuth<_Auth>>;
}
```

| type                                  |
| ------------------------------------- |
| [`DropboxUserAuth`](#dropboxuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `DropboxTokens`

```ts
type DropboxTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};
```

### `DropboxUser`

```ts
type DropboxUser = PairedDropBoxUser | UnpairedDropboxUser;
```

```ts
type PairedDropBoxUser = BaseDropboxUser & {
	is_paired: true;
	team: {
		id: string;
		name: string;
		office_addin_policy: Record<string, string>;
		sharing_policies: Record<string, Record<string, string>>;
	};
};

type UnpairedDropboxUser = BaseDropboxUser & {
	is_paired: false;
};

type BaseDropboxUser = {
	account_id: string;
	country: string;
	disabled: boolean;
	email: string;
	email_verified: boolean;
	locale: string;
	name: {
		abbreviated_name: string;
		display_name: string;
		familiar_name: string;
		given_name: string;
		surname: string;
	};
	profile_photo_url: string;
};
```

### `DropboxUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface Auth0UserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	dropboxUser: DropboxUser;
	dropboxTokens: DropboxTokens;
}
```

| properties      | type                              | description       |
| --------------- | --------------------------------- | ----------------- |
| `dropboxUser`   | [`DropboxUser`](#dropboxuser)     | Dropbox user      |
| `dropboxTokens` | [`DropboxTokens`](#dropboxtokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
