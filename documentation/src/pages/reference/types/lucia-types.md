---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Lucia types"
---

## LuciaError

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

## `UserData`

The columns of `user` table excluding `hashed_password` and `provider_id`.

```ts
type UserData = {
    id: string;
} & Lucia.UserAttributes;
```

| name | type                                                                       | description                        |
| ---- | -------------------------------------------------------------------------- | ---------------------------------- |
| id   | `string`                                                                   | User id of the user                |
|      | [`Lucia.UserAttributes`](/reference/types/type-declaration#userattributes) | Additional columns in `user` table |
