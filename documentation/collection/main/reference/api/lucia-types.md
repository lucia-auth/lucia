---
_order: 3
title: "Types"
---

Types can be imported from `lucia-auth`.

```ts
import type { Adapter } from "lucia-auth";
```

## `Adapter`

Refer to [Adapters](/reference/adapters/api) reference.

## `AdapterFunction`

Refer to [Adapters](/reference/adapters/api) reference. `LuciaErrorConstructor` is the constructor function (class reference) of [`LuciaError`](/reference/api/luciaerror).

```ts
export type AdapterFunction<A extends Adapter | UserAdapter | SessionAdapter> =
	(LuciaError: LuciaErrorConstructor) => A;
```

## `Cookie`

```ts
type Cookie = {
	name: string;
	value: string;
	attributes: CookieAttributes; // cookie npm package serialize() options
	serialize: () => string;
};
```

### `serialize()`

Serializes the cookie using the name, value, and options using [`cookies`](https://www.npmjs.com/package/cookie) npm package.

```ts
const serialize: () => string;
```

## `Key`

Represents a key.

```ts
export type Key = {
	isPasswordDefined: boolean;
	isPrimary: boolean;
	providerId: string;
	providerUserId: string;
	userId: string;
};
```

| name              | type      | description                                                                       |
| ----------------- | --------- | --------------------------------------------------------------------------------- |
| isPasswordDefined | `boolean` | time of the [active period](/learn/start-here/concepts#session-states) expiration |
| isPrimary         | `boolean` | `true` if primary key of user (key created with the user )                        |
| providerId        | `string`  | provider id                                                                       |
| providerUserId    | `string`  | provider user id                                                                  |
| userId            | `string`  | user id of linked user                                                            |

## `Lucia`

A namespace.

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("lucia-auth").Auth;
	type UserAttributes = {};
}
```

### `Auth`

Should be set to [`Auth`](/reference/api/auth).

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

## `LuciaError`

Errors thrown by Lucia. Refer to [Errors](/reference/api/errors) for a list of error messages.

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

| name                | type                 | description                                                                       |
| ------------------- | -------------------- | --------------------------------------------------------------------------------- |
| activePeriodExpires | `Date`               | time of the [active period](/learn/start-here/concepts#session-states) expiration |
| idlePeriodExpires   | `Date`               | time of the [idle period](/learn/start-here/concepts#session-states) expiration   |
| isFresh             | `boolean`            | `true` if the session was newly created (including on renewal)                    |
| sessionId           | `string`             | session id                                                                        |
| state               | `"active" \| "idle"` | [session state](/learn/start-here/concepts#session-states)                        |
| userId              | `string`             | user id of the user of the session                                                |

## `SessionAdapter`

Refer to [Adapters](/reference/adapters/api) reference.

## `SessionSchema`

Refer to [Database model](/reference/adapters/database-model#schema-type-1) reference.

## `User`

Return type of [`transformUserData()`](/reference/api/configuration#transformuserdata) config.

```ts
type User = ReturnType<typeof transformUserData>;
```

### Default

If `transformUserData()` is undefined.

```ts
type User = {
	userId: string;
};
```

## `UserAdapter`

Refer to [Adapters](/reference/adapters/api) reference.

## `UserData`

Data from `user` table.

```ts
type UserData = {
	id: string;
} & Required<Lucia.UserAttributes>;
```

| name | type                                                                | description                        |
| ---- | ------------------------------------------------------------------- | ---------------------------------- |
| id   | `string`                                                            | user id of the user                |
|      | [`Lucia.UserAttributes`](/reference/api/lucia-types#userattributes) | additional columns in `user` table |

## `UserSchema`

Refer to [Database model](/reference/adapters/database-model#schema-type-1) reference.
