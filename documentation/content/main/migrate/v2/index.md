---
title: "Migrate to v2"
description: "Learn how to migrate Lucia version 1 to version 2"
---

### Breaking changes

- **`lucia-auth` is published under `lucia`** (all other packages remain the same)
- **`@lucia-auth/tokens` is not compatible with version 2** (See [Implementing 2FA without the tokens integration (v1/v2)](https://github.com/pilcrowOnPaper/lucia/discussions/728))
- **Removed single use and primary keys**
- **Update `nextjs()` and `web()` middleware**
- **`generateRandomString()` (user and session ids) only uses lowercase letters and numbers by default (no uppercase)**
- Replace session renewal with session resets
- Database tables cannot use default values
- Official adapters no longer enforce table names
- Some items previously exported from `lucia-auth` are now exported from `lucia/utils`
- Updated adapter API to be more simple and future-proof

### New features

- Custom session attributes!
- Bearer token support

## Installation

Remove `lucia-auth` from your package.json. Install the new version of `lucia`:

```
npm i lucia@latest
pnpm add lucia@latest
yarn add lucia@latest
```

If you're using the OAuth integration, install the new version of it as well:

```
npm i @lucia-auth/oauth@latest
pnpm add @lucia-auth/oauth@latest
yarn add @lucia-auth/oauth@latest
```

## Database and adapters

See each database adapter package's migration guide:

- [`@lucia-auth/adapter-mongoose`](/migrate/v2/mongoose)
- [`@lucia-auth/adapter-mysql`](/migrate/v2/mysql)
- [`@lucia-auth/adapter-postgresql`](/migrate/v2/postgresql)
- [`@lucia-auth/adapter-prisma`](/migrate/v2/prisma)
- [`@lucia-auth/adapter-session-redis`](/migrate/v2/redis)
- [`@lucia-auth/adapter-sqlite`](/migrate/v2/sqlite)

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
	getUserAttributes: (data) => {
		return {
			// IMPORTANT!!!!
			// `userId` included by default!!
			username: data.username
		};
	},

	// autoDatabaseCleanup: false, <= removed for now
	csrfProtection: {
		allowedSubdomains: ["foo"] // allow https://foo.example.com
	} // can be boolean
	// generateCustomUserId, <= removed, see `csrfProtection`
	passwordHash, // previously `hash`
	// origin, <= removed
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

### Use custom user id

While `generateCustomUserId()` configuration has been removed, you can now pass a custom user id to [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser).

```ts
await auth.createUser({
	userId: generateCustomUserId(),
	attributes: {}
});
```

## `generateRandomString()`

`generateRandomString()` only uses lowercase letters and numbers by default (no uppercase). This applies to user and session ids as well. To use the old id generation, pass a custom alphabet when using `generateRandomString()`:

```ts
import { generateRandomString } from "lucia/utils";

const alphabet =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

await auth.createUser({
	userId: generateRandomString(15, alphabet)
	// ...
});
```

## Creating sessions and keys

`Auth.createSession()` and `Auth.createKey()` now takes a single parameter.

```ts
// v1
await auth.createSession(userId);
await auth.createKey(userId, {
	// ...
});

// v2
await auth.createSession({
	userId,
	attributes: {} // must be defined!
});
await auth.createKey({
	userId
	// ...
});
```

## Middleware

With v2, Lucia no longer needs to set new session cookies when validating sessions if `sessionCookie.expires` configuration is set to `false`.

```ts
lucia({
	sessionCookie: {
		expires: false
	}
});
```

This should only be enabled when necessary:

- If you're using `web()` middleware
- Next.js project using the app directory, or deployed to the edge

### `nextjs()`

`Auth.handleRequest()` no longer accepts `Response` and `Headers` when using the Next.js middleware. Passing only `IncomingMessage` or `Request` will disable `AuthRequest.setSession()`. We recommend setting cookies manually when creating a new session.

```ts
// removed
auth.handleRequest({
	req: req as IncomingMessage,
	headers: headers as Headers
});
auth.handleRequest({
	req: req as IncomingMessage,
	response: response as Response
});
auth.handleRequest({
	request: request as Request
});

// new - `AuthRequest.setSession()` disabled
auth.handleRequest(req as IncomingMessage);
auth.handleRequest(request as Request);
```

`request` must be defined as well:

```ts
// v1
auth.handleRequest({
	cookies: cookies as Cookies,
	request: request as Request
});

// v2
auth.handleRequest({
	cookies: cookies as Cookies,
	request: request as Request | null
});
```

### `web()`

`Auth.handleRequest()` no longer accepts `Response` and `Headers` when using the web standard middleware. This means `AuthRequest.setSession()` is disabled, and we recommend setting cookies manually.

```ts
// v1
auth.handleRequest(request as Request, response as Response);
auth.handleRequest(request as Request, headers as Headers);

// v2
auth.handleRequest(request as Request);
```

## Validating sessions

`Auth.validateSessionUser()` and `AuthRequest.validateUser()` has been removed. The User object can now be accessed via `Session.user`.

```ts
const authRequest = auth.handleRequest();
const session = await auth.validateSession();
const session = await authRequest.validate();

const user = session.user;
```

### Session renewal

`Auth.renewSession()` has been removed.

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
await auth.createKey({
	userId,
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

### Update `ProviderUserAuth.validateCallback()`

User attributes should be provided as its own property.

```ts
const { createUser } = await githubAuth.validateCallback(code);

// v1
await createUser(attributes);

// v2
await createUser({
	attributes
});
```
