---
title: "Public types"
_order: 0
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
	sessionTimeout?: {
		activePeriod: number;
		idlePeriod: number;
	};
	transformUserData?: (userData: UserData) => Record<any, any>;
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

## `MinimalRequest`

A minimal representation of the standard [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) type needed for Lucia.

```ts
type MinimalRequest = {
	headers: {
		get: (name: string) => null | string;
	};
	url: string;
	method: string;
};
```

## `PersistentKey`

A persistent key.

```ts
type PersistentKey = {
	type: "persistent";
	isPrimary: boolean;
	isPasswordDefined: boolean;
	providerId: string;
	providerUserId: string;
	userId: string;
};
```

#### Properties

| name              | type           | description                |
| ----------------- | -------------- | -------------------------- |
| type              | `"persistent"` |                            |
| providerId        | `string`       | provider id                |
| providerUserId    | `string`       | provider user id           |
| userId            | `string`       | user id of linked user     |
| isPrimary         | `boolean`      | `true` if key is primary   |
| isPasswordDefined | `boolean`      | `true` if holds a password |

## `Session`

A session.

```ts
type Session = {
	activePeriodExpires: Date;
	idlePeriodExpires: Date;
	isFresh: boolean;
	sessionId: string;
	state: "active" | "idle";
	userId: string;
};
```

#### Properties

| name                | type                 | description                                                                 |
| ------------------- | -------------------- | --------------------------------------------------------------------------- |
| activePeriodExpires | `Date`               | time of the [active period](/start-here/concepts#session-states) expiration |
| idlePeriodExpires   | `Date`               | time of the [idle period](/start-here/concepts#session-states) expiration   |
| isFresh             | `boolean`            | `true` if the session was newly created (including on renewal)              |
| sessionId           | `string`             | session id                                                                  |
| state               | `"active" \| "idle"` | [session state](/start-here/concepts#session-states)                        |
| userId              | `string`             | user id of the user of the session                                          |

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
	expires: Date | null;
	isExpired: () => boolean;
};
```

#### Properties

| name           | type           | description                                  |
| -------------- | -------------- | -------------------------------------------- |
| type           | `"single_use"` |                                              |
| providerId     | `string`       | provider id                                  |
| providerUserId | `string`       | provider user id                             |
| userId         | `string`       | user id of linked user                       |
| expires        | `Date \| null` | expiration time, `null` if it doesn't expire |

### `isExpired()`

Returns `true` if expired.

```ts
const isExpired: () => boolean;
```

#### Returns

| type      | description       |
| --------- | ----------------- |
| `boolean` | `true` if expired |

## `User`

Return type of [`transformUserData()`](/basics/configuration#transformuserdata) config.

```ts
type User = ReturnType<typeof transformUserData>;
```

#### Default

If `transformUserData()` is undefined.

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
	getKey: (
		keyId: string,
		shouldDataBeDeleted: (key: KeySchema) => Promise<boolean>
	) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
	getUser: (userId: string) => Promise<UserSchema | null>;
	setKey: (key: KeySchema) => Promise<void>;
	setUser: (
		userId: string,
		attributes: Record<string, any>,
		key: KeySchema | null
	) => Promise<UserSchema>;
	updateKeyPassword: (
		key: string,
		hashedPassword: string | null
	) => Promise<void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema>;
};
```

## `UserData`

Data from `user` table.

```ts
type UserData = {
	id: string;
} & Required<Lucia.UserAttributes>;
```

| name | type                                                                 | description                        |
| ---- | -------------------------------------------------------------------- | ---------------------------------- |
| id   | `string`                                                             | user id of the user                |
|      | [`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes) | additional columns in `user` table |

## `UserSchema`

```ts
type UserSchema = {
	id: string;
} & Lucia.UserAttributes;
```

| type                                                                 |
| -------------------------------------------------------------------- |
| [`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes) |
