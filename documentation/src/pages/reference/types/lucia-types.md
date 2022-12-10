---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Lucia types"
---

Types can be imported from `lucia-auth/types`.

```ts
import type { Adapter } from "lucia-auth/types";
```

## `Adapter`

Refer to [Adapters](/reference/adapters/api) reference.

## `Auth`

Return type of [`lucia()`](/reference/api/server-api#lucia-default).

## `Cookie`

```ts
interface Cookie {
	name: string;
	value: string;
	attributes: CookieAttributes; // cookie npm package serialize() options
	serialize: () => string;
}
```

### `serialize()`

Serializes the cookie using the name, value, and options using [`cookies`](https://www.npmjs.com/package/cookie) npm package.

```ts
const serialize: () => string;
```

## `LuciaError`

All errors thrown by Lucia will use this error constructor. Refer to [Errors](/reference/types/errors) for a list of valid error names.

```ts
class LuciaError extends Error {}
```

```ts
const constructor: (errorName: LuciaErrorName) => void;
```

#### Parameter

| name      | type                            | description              |
| --------- | ------------------------------- | ------------------------ |
| errorName | `LuciaErrorName extends string` | a valid Lucia error name |

## `MinimalRequest`

A minimal representation of node's `Request` type needed for Lucia.

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

Return type of [`transformUserData()`](/reference/configure/lucia-configurations#transformuserdata) config.

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

The columns of `user` table excluding `hashed_password` and `provider_id`.

```ts
type UserData = {
	id: string;
} & Required<Lucia.UserAttributes>;
```

| name | type                                                                      | description                        |
| ---- | ------------------------------------------------------------------------- | ---------------------------------- |
| id   | `string`                                                                  | user id of the user                |
|      | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes) | additional columns in `user` table |

## `UserSchema`

Refer to [Database model](/reference/adapters/database-model#schema-type-1) reference.
