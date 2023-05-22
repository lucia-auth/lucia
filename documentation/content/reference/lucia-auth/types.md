---
title: "Public types"
_order: 2
---

These types can be imported from `lucia-auth`:

```ts
import type { Adapter } from "lucia-auth";
```

## `Adapter`

```ts
type Adapter = {
	getSessionAndUserBySessionId?: (sessionId: string) => Promise<{
		user: UserSchema;
		session: SessionSchema;
	} | null>;
} & UserAdapter &
	SessionAdapter;
```

| type                                                           |
| -------------------------------------------------------------- |
| [`SessionAdapter`](/reference/lucia-auth/types#sessionadapter) |
| [`UserAdapter`](/reference/lucia-auth/types#useradapter)       |

## `Configuration`

Refer to [Configuration](/basics/configuration) for full documentation.

```ts
type Configuration = {
	// required
	adapter:
		| (luciaError: typeof LuciaError) => Adapter
		| {
				user: (luciaError: typeof LuciaError) => UserAdapter
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
	sessionCookie?: CookieOption[];
	sessionExpiresIn?: {
		activePeriod: number;
		idlePeriod: number;
	};
	transformDatabaseUser?: (databaseUser: Required<UserSchema>) => Record<any, any>;
};
```

`MaybePromise` indicates it can be either a normal value or a promise:

```ts
type MaybePromise<T> = T | Promise<T>;
```

## `Key`

```ts
type Key = SingleUseKey | PersistentKey;
```

| type                                                         |
| ------------------------------------------------------------ |
| [`SingleUseKey`](/reference/lucia-auth/types#singleusekey)   |
| [`PersistentKey`](/reference/lucia-auth/types#persistentkey) |

## `KeySchema`

```ts
type KeySchema = {
	id: string;
	user_id: string;
	primary: boolean;
	hashed_password: string | null;
	expires: number | null;
};
```

## `Lucia`

A namespace.

```ts
// lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("lucia-auth").Auth;
	type UserAttributes = {};
}
```

### `Auth`

Should be set to [`Auth`](/reference/lucia-auth/auth).

#### Example

```ts
// lucia.ts
import lucia from "lucia-auth";

const auth = lucia();
export type Auth = typeof auth;
```

```ts
declare namespace Lucia {
	type Auth = import("lucia.js").Auth;
}
```

### `UserAttributes`

Extends `{}`. The additional user data stored in the `user` table. The keys should be the name of the columns.

#### Example

If you have a `username` column in `user` table:

```ts
declare namespace Lucia {
	interface UserAttributes {
		username: string;
	}
}
```

## `LuciaRequest`

```ts
type LuciaRequest = {
	method: string;
	url: string;
	headers: {
		origin: string | null;
		cookie: string | null;
	};
};
```

#### Properties

| name           | type             | description                       |
| -------------- | ---------------- | --------------------------------- |
| method         | `string`         | request method - case insensitive |
| url            | `string`         | request url/href                  |
| headers.origin | `string \| null` | `Origin` header value             |
| headers.origin | `string \| null` | `Cookie` header value             |

## `Middleware`

```ts
export type Middleware = (
	...middlewareArgs: [...args: any[], "DEV" | "PROD"]
) => RequestContext;
```

#### Parameters

| name | type              | description                                                      | introduced |
| ---- | ----------------- | ---------------------------------------------------------------- | ---------- |
| args | `any[]`           | any                                                              |            |
| env  | `"DEV" \| "PROD"` | value passed to [`Configuration.env`](/basics/configuration#env) | 1.3.0      |

#### Returns

| type                                                         |
| ------------------------------------------------------------ |
| [`RequestContext`](/reference/lucia-auth/types#luciarequest) |

## `PersistentKey`

A persistent key.

```ts
type PersistentKey = {
	type: "persistent";
	primary: boolean;
	passwordDefined: boolean;
	providerId: string;
	providerUserId: string;
	userId: string;
};
```

#### Properties

| name            | type           | description                |
| --------------- | -------------- | -------------------------- |
| type            | `"persistent"` |                            |
| providerId      | `string`       | provider id                |
| providerUserId  | `string`       | provider user id           |
| userId          | `string`       | user id of linked user     |
| primary         | `boolean`      | `true` if key is primary   |
| passwordDefined | `boolean`      | `true` if holds a password |

## `RequestContext`

```ts
type RequestContext = {
	request: LuciaRequest;
	setCookie: (cookie: Cookie) => void;
};
```

#### Properties

| name    | type                                                         |
| ------- | ------------------------------------------------------------ |
| request | [`RequestContext`](/reference/lucia-auth/types#luciarequest) |

### `setCookie`

Sets the provided cookie. Can be called multiple times.

```ts
const setCookie: (cookie: Cookie) => void;
```

#### Parameters

| name   | type                                     |
| ------ | ---------------------------------------- |
| cookie | [`Cookie`](/reference/lucia-auth/cookie) |

## `Session`

A session.

```ts
type Session = {
	activePeriodExpiresAt: Date;
	idlePeriodExpiresAt: Date;
	fresh: boolean;
	sessionId: string;
	state: "active" | "idle";
	userId: string;
};
```

#### Properties

| name                  | type                 | description                                                                 |
| --------------------- | -------------------- | --------------------------------------------------------------------------- |
| activePeriodExpiresAt | `Date`               | time of the [active period](/start-here/concepts#session-states) expiration |
| idlePeriodExpiresAt   | `Date`               | time of the [idle period](/start-here/concepts#session-states) expiration   |
| fresh                 | `boolean`            | `true` if the session was newly created (including on renewal)              |
| sessionId             | `string`             | session id                                                                  |
| state                 | `"active" \| "idle"` | [session state](/start-here/concepts#session-states)                        |
| userId                | `string`             | user id of the user of the session                                          |

## `SessionAdapter`

```ts
type SessionAdapter = {
	deleteSession: (...sessionIds: string[]) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (session: SessionSchema) => Promise<void>;
};
```

## `SessionSchema`

```ts
type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
};
```

## `SingleUseKey`

A single use key.

```ts
type SingleUseKey = {
	type: "single_use";
	providerId: string;
	providerUserId: string;
	userId: string;
	expiresAt: Date;
	expired: boolean;
};
```

#### Properties

| name           | type           | description            |
| -------------- | -------------- | ---------------------- |
| type           | `"single_use"` |                        |
| providerId     | `string`       | provider id            |
| providerUserId | `string`       | provider user id       |
| userId         | `string`       | user id of linked user |
| expiresAt      | `Date`         | expiration time        |
| expired        | `boolean`      | expiration time        |

## `User`

Return type of [`transformDatabaseUser()`](/basics/configuration#transformuserdata) config.

```ts
type User = ReturnType<typeof transformDatabaseUser>;
```

#### Default

If `transformDatabaseUser()` is undefined.

```ts
type User = {
	userId: string;
};
```

## `UserAdapter`

```ts
type UserAdapter = {
	deleteKeysByUserId: (userId: string) => Promise<void>;
	deleteNonPrimaryKey: (...key: string[]) => Promise<void>;
	deleteUser: (userId: string) => Promise<void>;
	getKey: (keyId: string) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
	getUser: (userId: string) => Promise<UserSchema | null>;
	setKey: (key: KeySchema) => Promise<void>;
	setUser: (
		userId: string,
		attributes: Record<string, any>,
		key: KeySchema | null
	) => Promise<UserSchema | void>;
	updateKeyPassword: (
		key: string,
		hashedPassword: string | null
	) => Promise<KeySchema | void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema | void>;
};
```

## `UserSchema`

```ts
type UserSchema = {
	id: string;
} & Lucia.UserAttributes;
```

| type                                                                 |
| -------------------------------------------------------------------- |
| [`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes) |
