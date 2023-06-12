---
_order: 7
title: "Configuration"
description: "Learn how to configure Lucia"
---

Configuration for [`lucia()`](/reference/lucia-auth/lucia-auth#lucia).

```ts
type Configuration = {
	// required
	adapter:
		| (luciaError: typeof LuciaError) => Adapter
		| {
				user:(luciaError: typeof LuciaError) => UserAdapter
				session: (luciaError: typeof LuciaError) => SessionAdapter
		  };
	env: Env;

	// optional
	autoDatabaseCleanup?: boolean;
	csrfProtection?: boolean;
	generateCustomUserId?: () => MaybePromise<string>;
	hash?: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	middleware: Middleware;
	origin: string[];
	sessionCookie?: CookieOption;
	sessionExpiresIn?: {
		activePeriod: number;
		idlePeriod: number;
	};
	transformDatabaseUser?: (databaseUser: Required<UserSchema>) => Record<any, any>;

	experimental?: {
		debugMode?: boolean
	}
};
```

`MaybePromise` indicates it can be either a normal value or a promise:

```ts
type MaybePromise<T> = T | Promise<T>;
```

## Required

### `adapter`

An adapter for your database. If you're using a single database:

```ts
const adapter: (luciaError: typeof LuciaError) => Adapter;
```

| type                                             |
| ------------------------------------------------ |
| [`LuciaError`](/reference/lucia-auth/luciaerror) |
| [`Adapter`](/reference/lucia-auth/types#adapter) |

or, it can take a different adapter for each table. A normal `Adapter` can be used for both `adapter.user` and `adapter.session`

#### `session` (required)

An adapter for the database that stores sessions.

```ts
const adapter: (luciaError: typeof LuciaError) => SessionAdapter;
```

| type                                                           |
| -------------------------------------------------------------- |
| [`LuciaError`](/reference/lucia-auth/luciaerror)               |
| [`SessionAdapter`](/reference/lucia-auth/types#sessionadapter) |

#### `user` (required)

An adapter for the database that stores users. Can be a normal `Adapter` function.

```ts
const adapter: (luciaError: typeof LuciaError) => UserAdapter;
```

| type                                                     |
| -------------------------------------------------------- |
| [`LuciaError`](/reference/lucia-auth/luciaerror)         |
| [`UserAdapter`](/reference/lucia-auth/types#useradapter) |

### `env`

Tells Lucia if the app is running on HTTP or HTTPS.

| type              | description                                                |
| ----------------- | ---------------------------------------------------------- |
| `"DEV" \| "PROD"` | `"DEV"` if the app is hosted on HTTP, `"PROD"` if on HTTPS |

## Optional

### `autoDatabaseCleanup`

Will remove [dead sessions](/start-here/concepts#session-states) from the database when certain methods are called.

| type      | default |
| --------- | ------- |
| `boolean` | `true`  |

Specifically, it removes the target session from the database if its dead on:

- `getSession()`
- `getSessionUser()`
- `validateSessionUser()`
- `validateSession()`

and deletes the target user's dead sessions from the database on:

- `updateUserProviderId()`
- `updateUserAttributes()`
- `createSession()`.

### `csrfProtection`

Checks if the request is from a trusted origin (where the app is hosted) in [`validateRequestHeaders()`](/reference/lucia-auth/auth#validaterequestheaders). If you set this to `false`, make sure to add your own CSRF protection.

| type      | default |
| --------- | ------- |
| `boolean` | `true`  |

### `generateCustomUserId()`

A function that generates a random user id.

```ts
const generateCustomUserId: () => MaybePromise<string>;
```

##### Returns

| type     | description |
| -------- | ----------- |
| `string` | a user id   |

### `hash`

#### `generate()` (required)

Generates a password-safe hash. Uses `scrypt` based on [noble-hashes](https://github.com/paulmillr/noble-hashes) by default.

```ts
const generate: (s: string) => MaybePromise<string>;
```

> (warn) Make sure the algorithm used is safe for hashing passwords, such as `bcrypt`, `scrypt`, `argon2`, `PBKDF2` - algorithms such as `md5` and `SHA-1` are **NOT** suitable for hashing passwords.

##### Parameter

| name | type     | description        |
| ---- | -------- | ------------------ |
| s    | `string` | the string to hash |

##### Returns

| type     | description                                    |
| -------- | ---------------------------------------------- |
| `string` | the hashed string - can be a promise if needed |

#### `validate()` (required)

Validates a string against a hash generated using [`hash.generate()`](/basics/configuration#generate-required).

```ts
const validate: (s: string, hash: string) => MaybePromise<boolean>;
```

##### Parameter

| name | type     | description                         |
| ---- | -------- | ----------------------------------- |
| s    | `string` | the string to validate              |
| hash | `string` | hash to validate the string against |

##### Returns

| type      | description                                                     |
| --------- | --------------------------------------------------------------- |
| `boolean` | `true` if valid, `false` otherwise - can be a promise if needed |

### `middleware`

[Middleware](basics/handle-requests#middleware).

```ts
const middleware: Middleware;
```

| type                                                   |
| ------------------------------------------------------ |
| [`Middleware`](/reference/lucia-auth/types#middleware) |

### `origin`

A list of valid url origin when checking for CSRF.

```ts
const origin: string[];
```

### `sessionCookie`

A list of cookie options for setting session cookie(s). Beware that setting the domain without a domain without a subdomain will make the cookie available to **_all_** subdomains, which is a major security issue. Some options (`httpOnly`, `secure`, `expires`) cannot be configured due to security concerns.

| type           | default                            |
| -------------- | ---------------------------------- |
| `CookieOption` | `[{ sameSite: "lax", path: "/" }]` |

```ts
type CookieOption = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};
```

### `sessionExpiresIn`

#### `activePeriod`

The time in milliseconds the [active period](/basics/sessions#session-states) lasts for - or the time since session creation that it can be used.

| type     | default                          |
| -------- | -------------------------------- |
| `number` | `1000 * 60 * 60 * 24` (24 hours) |

#### `idlePeriod`

The time in milliseconds the [idle period](/basics/sessions#session-states) lasts for - or the time since active period expiration that it can be renewed.

| type     | default                              |
| -------- | ------------------------------------ |
| `number` | `1000 * 60 * 60 * 24 * 14` (2 weeks) |

### `transformDatabaseUser()`

This will be called to transform the raw data from `user` table to an object that will be mapped to [`User`](/reference/lucia-auth/types#user).

```ts
const transformDatabaseUser: (
	databaseUser: Required<UserSchema>
) => Record<any, any>;
```

#### Parameter

| name         | type                                                                 | description                 |
| ------------ | -------------------------------------------------------------------- | --------------------------- |
| databaseUser | `Required<`[`UserSchema`](/reference/lucia-auth/types#userschema)`>` | the user data from database |

#### Returns

| type               | description                               |
| ------------------ | ----------------------------------------- |
| `Record<any, any>` | an object that will be mapped to [`User`] |

#### Default

```ts
const transformDatabaseUser = async () => {
	userId: string;
};
```

## Experimental

You can enable experimental feature with the `experimental` config. Please keep in mind that features marked as experimental are not stable and may change or be deleted anytime.

### `experimental.debugMode`

When enabled, Lucia logs relevant events to the console.

```ts
const debugMode: boolean;
```
