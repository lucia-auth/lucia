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

## `Tokens`

```ts
type Tokens = {
    accessToken: [string, string];
    refreshToken: [string, string];
    cookies: string[];
};
```

| name            | type       | description                                                |
| --------------- | ---------- | ---------------------------------------------------------- |
| accessToken[0]  | `string`   | The access token                                           |
| accessToken[1]  | `string`   | The cookie string of the access token                      |
| refreshToken[0] | `string`   | The refresh token                                          |
| refreshToken[1] | `string`   | The cookie string of the refresh token                     |
| cookies         | `string[]` | An array of all the cookie strings (access, refresh token) |

## `User`

```ts
type User = {
    userId: string;
    providerId: string;
} & Lucia.UserData;
```

| name       | type                                                           | description                                      |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------ |
| userId     | `string`                                                       | The user id of the user                          |
| providerId | `string`                                                       | The provider id: `${providerName}:${identifier}` |
|            | [`Lucia.UserData`](/reference/types/type-declaration#userdata) |                                                  |
