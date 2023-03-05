---
_order: 0
title: "Lucia configurations"
---

Configurations for `lucia()`.

```ts
type Configurations = {
	// required
	adapter:
		| AdapterFunction<Adapter>
		| {
				user: AdapterFunction<UserAdapter>;
				session: AdapterFunction<SessionAdapter>;
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
	sessionCookie?: CookieOption[];
	sessionTimeout?: {
		activePeriod: number;
		idlePeriod: number;
	};
	transformUserData?: (userData: UserData) => Record<any, any>;
};
```

```ts
type CookieOption = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};
```

`MaybePromise` indicates it can be either a normal value or a promise:

```ts
type MaybePromise<T> = T | Promise<T>;
```

## Required

### `adapter`

An adapter for your database. If you're using a single database:

| type                                                                                                            |
| --------------------------------------------------------------------------------------------------------------- |
| [`AdapterFunction`](/reference/adapters/api#adapterfunction)`<`[`Adapter`](/reference/adapters/api#adapter) `>` |

or, it can take a different adapter for each table. A normal `Adapter` can be used for both `adapter.user` and `adapter.session`

#### `user` (required)

An adapter for the database that stores users. Can be a normal `AdapterFunction<Adapter>` adapter.

| type                                                                           |
| ------------------------------------------------------------------------------ |
| `AdapterFunction<`[`UserAdapter`](/reference/types/lucia-types#useradapter)`>` |

#### `session` (required)

An adapter for the database that stores sessions.

| type                                                                              |
| --------------------------------------------------------------------------------- |
| `AdapterFunction<`[`SessionAdapter`](/reference/types/lucia-types#useradapter)`>` |

### `env`

Tells Lucia if the app is running on HTTP or HTTPS.

| type              | description                                                |
| ----------------- | ---------------------------------------------------------- |
| `"DEV" \| "PROD"` | `"DEV"` if the app is hosted on HTTP, `"PROD"` if on HTTPS |

## Optional

### `autoDatabaseCleanup`

Will remove [dead sessions](/learn/start-here/concepts#session-states) from the database when certain methods are called.

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

Checks if the request is from a trusted origin (where the app is hosted) in [`validateRequestHeaders()`](/reference/api/server-api#validaterequestheaders). If you set this to `false`, make sure to add your own CSRF protection.

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

Generates a password-safe hash. Uses `scrypt` from [noble-hashes](https://github.com/paulmillr/noble-hashes) by default.

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

Validates a string against a hash generated using [`hash.generate()`](/reference/configure/lucia-configurations#generate-required).

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

### `sessionCookie`

A list of cookie options for setting session cookie(s). Beware that setting the domain without a domain without a subdomain will make the cookie available to **_all_** subdomains, which is a major security issue. Some options (`httpOnly`, `secure`, `expires`) cannot be configured due to security concerns.

| type             | default                            |
| ---------------- | ---------------------------------- |
| `CookieOption[]` | `[{ sameSite: "lax", path: "/" }]` |

### `sessionTimeout`

#### `activePeriod`

The time in milliseconds the [active period](/learn/start-here/concepts#session-states) lasts for - or the time since session creation that it can be used.

| type     | default                          |
| -------- | -------------------------------- |
| `number` | `1000 * 60 * 60 * 24` (24 hours) |

#### `idlePeriod`

The time in milliseconds the [idle period](/learn/start-here/concepts#session-states) lasts for - or the time since active period expiration that it can be renewed.

| type     | default                              |
| -------- | ------------------------------------ |
| `number` | `1000 * 60 * 60 * 24 * 14` (2 weeks) |

### `transformUserData()`

This will be called to transform the raw data from `user` table to an object that will be mapped to [`User`](/reference/types/lucia-types#user).

```ts
const transformUserData: (userData: UserData) => Record<any, any>;
```

#### Parameter

| name     | type                                                | description                 |
| -------- | --------------------------------------------------- | --------------------------- |
| userData | [`UserData`](/reference/types/lucia-types#userdata) | the user data from database |

#### Returns

| type               | description                               |
| ------------------ | ----------------------------------------- |
| `Record<any, any>` | an object that will be mapped to [`User`] |

#### Default

```ts
const transformUserData = async () => {
	userId: string;
};
```
