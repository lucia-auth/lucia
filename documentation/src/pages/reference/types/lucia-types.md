---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Lucia types"
---

Types can be imported from `lucia-sveltekit/types`.

```ts
import type { Adapter } from "lucia-sveltekit/types";
```

## `Adapter`

Refer to [Adapters](/reference/adapters/adapters) reference.

## `ClearSession`

Type for [`clearSessions()`](/reference/api/locals-api#clearsession) locals method.

```ts
type ClearSession = () => void;
```

## `GetSession`

Type for [`getSession()`](/reference/api/locals-api#getsession) locals method.

```ts
type GetSession = () => Session | null;
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
| errorName | `LuciaErrorName extends string` | A valid Lucia error name |

## `Session`

A session.

```ts
type Session = {
    userId: string;
    expires: number;
};
```

| name    | type     | description                         |
| ------- | -------- | ----------------------------------- |
| userId  | `string` | User id of the user of the session  |
| expires | `number` | Unix time of the session expiration |

## `SessionAdapter`

Refer to [Adapters](/reference/adapters/adapters) reference.

## `SessionSchema`

Refer to [Database model](/reference/adapters/database-model#schema-type-1) reference.

## `SetSession`

Type for [`setSession()`](/reference/api/locals-api#setsession) locals method.

```ts
type SetSession = (session: Session) => void;
```

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

Refer to [Adapters](/reference/adapters/adapters) reference.

## `UserData`

The columns of `user` table excluding `hashed_password` and `provider_id`.

```ts
type UserData = {
    id: string;
} & Required<Lucia.UserAttributes>;
```

| name | type                                                                      | description                        |
| ---- | ------------------------------------------------------------------------- | ---------------------------------- |
| id   | `string`                                                                  | User id of the user                |
|      | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes) | Additional columns in `user` table |


## `UserSchema`

Refer to [Database model](/reference/adapters/database-model#schema-type-1) reference.