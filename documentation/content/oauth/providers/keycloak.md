---
title: "Keycloak OAuth provider"
description: "Learn how to use the Keycloak OAuth provider"
---

OAuth integration for Keycloak. Refer to [Keycloak Documentation](https://www.keycloak.org/docs/latest/authorization_services/index.html) for getting the required credentials. Provider id is `keycloak`.

```ts
import { keycloak } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const keycloakAuth = keycloak(auth, config);
```

## `keycloak()`

```ts
const keycloak: (
	auth: Auth,
	config: {
		domain: string;
		realm: string;
		clientId: string;
		clientSecret: string;
		scope?: string[];
		redirectUri?: string;
	}
) => KeycloakProvider;
```

##### Parameters

| name                  | type                                       | description                                         | optional |
| --------------------- | ------------------------------------------ | --------------------------------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                                      |          |
| `config.domain`       | `string`                                   | Keycloak OAuth app client id (e.g. 'my.domain.com') |          |
| `config.realm`        | `string`                                   | Keycloak Realm of client                            |          |
| `config.clientId`     | `string`                                   | Keycloak OAuth app client id                        |          |
| `config.clientSecret` | `string`                                   | Keycloak OAuth app client secret                    |          |
| `config.scope`        | `string[]`                                 | an array of scopes                                  |    ✓     |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI                          |    ✓     |

##### Returns

| type                                    | description       |
| --------------------------------------- | ----------------- |
| [`KeycloakProvider`](#keycloakprovider) | Keycloak provider |

## Interfaces

### `KeycloakAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<KeycloakAuth<_Auth>>

interface KeycloakAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<KeycloakUserAuth<_Auth>>;
}
```

| type                                    |
| --------------------------------------- |
| [`KeycloakUserAuth`](#keycloakuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `KeycloakTokens`

```ts
type KeycloakTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	authTime: number;
	issuedAtTime: number;
	expirationTime: number;
	refreshToken: string | null;
	refreshTokenExpiresIn: number | null;
};
```

### `KeycloakUser`

```ts
type KeycloakUser = {
	exp: number;
	iat: number;
	auth_time: number;
	jti: string;
	iss: string;
	aud: string;
	sub: string;
	typ: string;
	azp: string;
	session_state: string;
	at_hash: string;
	acr: string;
	sid: string;
	email_verified: boolean;
	name: string;
	preferred_username: string;
	given_name: string;
	locale: string;
	family_name: string;
	email: string;
	picture: string;
	user: any;
};
```

### `KeycloakRole`

```ts
type KeycloakUser = PublicKeycloakUser | PrivateKeycloakUser;

type KeycloakRole = {
	role_type: "realm" | "resource";

	client: null | string; // null if realm_access

	role: string;
};
```

### `KeycloakUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface KeycloakUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	keycloakUser: KeycloakUser;
	keycloakTokens: KeycloakTokens;
	keycloakRoles: KeycloakRoles;
}
```

| properties       | type                                | description                              |
| ---------------- | ----------------------------------- | ---------------------------------------- |
| `keycloakUser`   | [`KeycloakUser`](#keycloakuser)     | Keycloak user                            |
| `keycloakTokens` | [`KeycloakTokens`](#keycloaktokens) | Access tokens etc                        |
| `keycloakRoles`  | [`KeycloakRoles`](#keycloakroles)   | Keycloak roles retrieved from OIDC Token |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
