---
order: 3
title: "Migrate to v2 (beta)"
description: "Learn how to migrate Lucia version 1 to version 2 beta"
---

> This is a migration to v2 beta. Please keep in mind that while there won't be any further changes to the database schema, APIs are bound to change before the stable release.

### Breaking changes

- **`lucia-auth` is published under `lucia`** (all other packages remain the same)
- **`@lucia-auth/tokens` is not compatible with version 2** (See [Implementing 2FA without the tokens integration (v1/v2)](https://github.com/pilcrowOnPaper/lucia/discussions/728))
- **Removed single use and primary keys**
- Database tables cannot use default values
- Official adapters no longer enforce table names
- Some items previously exported from `lucia-auth` are now exported from `lucia/utils`
- Updated adapter API to be more simple and future-proof
- Repo requires Node.js 20

### New features

- Custom session attributes!
- Bearer token support

## Installation

Remove `lucia-auth` from your package.json. Install the beta version of `lucia`:

```
npm i lucia@beta
pnpm add lucia@beta
yarn add lucia@beta
```

If you're using the OAuth integration, install the beta version of it as well:

```
npm i @lucia-auth/oauth@beta
pnpm add @lucia-auth/oauth@beta
yarn add @lucia-auth/oauth@beta
```

## Database and adapters

See each database adapter package's migration guide:

- [`@lucia-auth/adapter-mongoose`](/start-here/migrate-v2/mongoose)
- [`@lucia-auth/adapter-mysql`](/start-here/migrate-v2/mysql)
- [`@lucia-auth/adapter-postgresql`](/start-here/migrate-v2/postgresql)
- [`@lucia-auth/adapter-prisma`](/start-here/migrate-v2/prisma)
- [`@lucia-auth/adapter-session-redis`](/start-here/migrate-v2/redis)
- [`@lucia-auth/adapter-sqlite`](/start-here/migrate-v2/sqlite)

## `Lucia` namespace

```ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth; // no change
	type DatabaseUserAttributes = {}; // formerly `UserAttributes`
	type DatabaseSessionAttributes = {}; // new
}
```

## Imports

Lucia core and adapters no longer use default exports.

```ts
// v1
import lucia from "lucia-auth";

// v2
import { lucia } from "lucia";
```

You should find and replace all instances of "lucia-auth" (or 'lucia-auth') with "lucia".

## Initialize Lucia

The configuration for `lucia()` has been overhauled. See [Configuration](/basics/configuration) for details.

```ts
// v1
const auth = lucia({
	adapter: adapter(),
	env,
	middleware: framework(),

	transformDatabaseUser = (data) => {
		return {
			userId: data.id,
			username: data.username
		};
	},

	autoDatabaseCleanup: false,
	csrfProtection: true,
	generateCustomUserId: () => generateRandomString(16),
	hash,
	origin: ["https://foo.example.com"],
	sessionCookie: {
		sameSite: "strict"
	},
	sessionExpiresIn
});
```

```ts
// v2
const auth = lucia({
	adapter: adapter(), // no change
	env, // no change
	middleware: framework(), // no change

	// previously `transformDatabaseUser`
	getUserAttributes = (data) => {
		return {
			// IMPORTANT!!!!
			// `userId` included by default!!
			username: data.username
		};
	},

	// autoDatabaseCleanup: false, <= removed for now
	csrfProtection: true, // no change
	generateUserId: () => generateRandomString(16), // previously `generateCustomUserId()`
	passwordHash, // previously `hash`
	allowedRequestOrigins: ["https://foo.example.com"], // previously `origin`
	sessionCookie: {
		name: "user_session", // session cookie name
		attributes: {
			// moved previous `sessionCookie` value here
			sameSite: "strict"
		}
	},
	sessionExpiresIn // no change
});
```

## Validating sessions

`Auth.validateSessionUser()` and `AuthRequest.validateUser()` has been removed. The User object can now be accessed via `Session.user`.

```ts
const authRequest = auth.handleRequest();
const session = await auth.validateSession();
const session = await authRequest.validate();

const user = session.user;
```

### Reading cookies manually

`Auth.parseRequestHeaders()` has been removed and replaced with [`Auth.validateRequestOrigin()`](/reference/lucia/interfaces/auth#validaterequestorigin) and [`Auth.readSessionCookie()`](/reference/lucia/interfaces/auth#readsessioncookie).

```ts
auth.validateRequestOrigin(request as LuciaRequest); // csrf check
const sessionCookie = auth.readSessionCookie(request.headers.cookie); // does NOT handle csrf check

type LuciaRequest = {
	method: string;
	url: string;
	headers: {
		origin: string | null;
		cookie: string | null;
		authorization: string | null;
	};
	storedSessionCookie?: string | null;
};
```

## Default database values

Lucia no longer supports database default values for database tables.

```ts
// v1
await auth.createUser({
	attributes: {
		// (admin = false) set by database
	}
});

// v2
await auth.createUser({
	attributes: {
		admin: false // must manually pass value
	}
});
```

This means `Lucia.DatabaseUserAttributes` (formerly `UserAttributes`) cannot have optional properties.

## Primary keys

Primary keys have been removed. We recommend storing the provider id of the primary key as a user attributes if you rely on it.

```ts
// v1
await auth.createUser({
	primaryKey: {
		// ...
	}
});

// v2
await auth.createUser({
	key: {
		// ...
	}
});
```

## Single use keys

Single use keys have been removed. We recommend implementing your tokens as they're more secure. Make sure to update `Auth.createKey()` even if you weren't using single use keys.

```ts
// v1
await auth.createKey(userId, {
	type: "persistent",
	providerId,
	providerUserId,
	password
});

// v2
await auth.createKey(userId, {
	providerId,
	providerUserId,
	password
});
```

## `lucia/utils`

Added new `/utils` export, which exports `generateRandomString()` among other utilities.

```ts
import {
	generateRandomString,
	serializeCookie,
	isWithinExpiration
} from "lucia/utils";
```

## OAuth

The OAuth package also had some changes as well.

### Removed `provider()`

We now provide [`providerUserAuth()`](/reference/oauth/interfaces#provideruserauth) which is a lower level API for implementing your own provider.

### Renamed `providerUser` and `tokens`

`providerUser` and `tokens` of the `validateCallback()` return value is now renamed to `githubUser` and `githubTokens`, etc.

```ts
const { githubUser, githubTokens } = await githubAuth.validateCallback(code);
```

### Removed `LuciaOAuthRequestError`

`LuciaOAuthRequestError` is replaced with [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).
