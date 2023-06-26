---
order: 3
title: "Interfaces"
---

These types can be imported from `lucia`.

```ts
import type { Adapter } from "lucia";
```

## `Adapter`

See [Database adapter API](/extending-lucia/database-adapters-api#adapter).

## `Auth`

See [`Auth`](/reference/lucia/interfaces/auth).

## `AuthRequest`

See [`AuthRequest`](/reference/lucia/interfaces/authrequest).

## `Configuration`

See [configuration](/basics/configuration).

## `Cookie`

```ts
type Cookie = {
	name: string;
	value: string;
	attributes: CookieAttributes;
	serialize: () => string;
};
```

### Properties

| property     | type               | description       |
| ------------ | ------------------ | ----------------- |
| `name`       | `string`           | Cookie name       |
| `value`      | `string`           | Cookie value      |
| `attributes` | `CookieAttributes` | Cookie attributes |

```ts
type CookieAttributes = {
	domain?: string | undefined;
	encode?: (value: string) => string;
	expires?: Date | undefined;
	httpOnly?: boolean | undefined;
	maxAge?: number | undefined;
	path?: string | undefined;
	priority?: "low" | "medium" | "high" | undefined;
	sameSite?: true | false | "lax" | "strict" | "none" | undefined;
	secure?: boolean | undefined;
};
```

### `serialize()`

Serializes the cookie into a `Set-Cookie` HTTP response header value.

```ts
const serialize: () => string;
```

## `Env`

```ts
type Env = "DEV" | "PROD";
```

## `InitializeAdapter`

```ts
type InitializeAdapter<_Adapter> => (LuciaError: LuciaErrorConstructor) => _Adapter
```

## `Key`

```ts
type Key = {
	userId: string;
	providerId: string;
	providerUserId: string;
	passwordDefined: boolean;
};
```

### Properties

| name              | type      | description                |
| ----------------- | --------- | -------------------------- |
| `providerId`      | `string`  | Provider id                |
| `providerUserId`  | `string`  | Provider user id           |
| `userId`          | `string`  | User id of linked user     |
| `passwordDefined` | `boolean` | `true` if holds a password |

## `KeySchema`

```ts
type KeySchema = {
	id: string;
	hashed_password: string | null;
	user_id: string;
};
```

## `LuciaErrorConstructor`

Constructor for [`LuciaError`](/reference/lucia/main#luciaerror).

```ts
const LuciaErrorConstructor: (message: string) => LuciaError;
```

## `LuciaRequest`

```ts
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

### Properties

Optional property `storedSessionCookie` is for frameworks with APIs to directly read and set cookies.

| property                | type             | optional | description                                              |
| ----------------------- | ---------------- | :------: | -------------------------------------------------------- |
| `method`                | `string`         |          | Request url (case insensitive)                           |
| `url`                   | `string`         |          | Full request url (e.g. `http://localhost:3000/pathname`) |
| `headers.origin`        | `string \| null` |          | `Origin` header value                                    |
| `headers.cookie`        | `string \| null` |          | `Cookie` header value                                    |
| `headers.authorization` | `string \| null` |          | `Authorization` header value                             |
| `storedSessionCookie`   | `string \| null` |    ✓     | Session cookie value                                     |

## `Middleware`

See [Middleware API](/extending-lucia/middleware-api#middleware).

## `RequestContext`

See [Middleware API](/extending-lucia/middleware-api#requestcontext).

## `Session`

```ts
type Session = {
	user: User;
	sessionId: string;
	activePeriodExpiresAt: Date;
	idlePeriodExpiresAt: Date;
	state: "idle" | "active";
	fresh: boolean;
} & ReturnType<_Configuration["getSessionAttributes"]>;
```

### Properties

`ReturnType<_Configuration["getSessionAttributes"]>` represents the return type of [`getSessionAttributes()`](/basics/configuration#getsessionattributes) configuration.

| name                    | type                                       | description                                                                 |
| ----------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `activePeriodExpiresAt` | `Date`                                     | Time of the [active period](/start-here/concepts#session-states-and-session-resets) expiration |
| `idlePeriodExpiresAt`   | `Date`                                     | Time of the [idle period](/start-here/concepts#session-states-and-session-resets) expiration   |
| `fresh`                 | `boolean`                                  | `true` if the session was newly created or reset                            |
| `sessionId`             | `string`                                   | Session id                                                                  |
| `state`                 | `"active" \| "idle"`                       | [Session state](/start-here/concepts#session-states-and-session-resets)                        |
| `user`                  | [`User`](/reference/lucia/interfaces#user) | User of the session                                                         |

## `SessionAdapter`

See [Database adapter API](/extending-lucia/database-adapters-api#sessionadapter).

## `SessionSchema`

```ts
type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
} & Lucia.DatabaseSessionAttributes;
```

## `User`

```ts
type User = {
	userId: string;
} & ReturnType<_Configuration["getUserAttributes"]>;
```

### Properties

`ReturnType<_Configuration["getUserAttributes"]>` represents the return type of [`getUserAttributes()`](/basics/configuration#getuserattributes) configuration.

| name     | type     | description |
| -------- | -------- | ----------- |
| `userId` | `string` | User id     |

## `UserAdapter`

See [Database adapter API](/extending-lucia/database-adapters-api#useradapter).

## `UserSchema`

```ts
type UserSchema = {
	id: string;
} & Lucia.DatabaseUserAttributes;
```
