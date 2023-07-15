---
order: 1
title: "/utils"
format: "code"
---

## `generateRandomString()`

Generates a cryptographically random string. If argument for parameter `alphabet` is not provided, the result with consist of `a-ZA-Z0-9`.

```ts
import { generateRandomString } from "lucia/utils";
```

```ts
const generateRandomString: (length: number, alphabet?: string) => string;
```

##### Parameters

| name       | type     | optional | description                                        |
| ---------- | -------- | :------: | -------------------------------------------------- |
| `length`   | `number` |          | Length string to generate                          |
| `alphabet` | `string` |    ✓     | String of characters to generate the string from ` |

##### Returns

| type     | description               |
| -------- | ------------------------- |
| `string` | Randomly generated string |

## `isWithinExpiration()`

Checks with the current time is within the expiration time (in milliseconds UNIX time) provided.

```ts
import { isWithinExpiration } from "lucia/utils";
```

```ts
const isWithinExpiration: (expiration: number) => boolean;
```

##### Parameters

| name         | type     | description                                 |
| ------------ | -------- | ------------------------------------------- |
| `expiration` | `number` | Expiration time in milliseconds (UNIX time) |

##### Returns

| value   | description          |
| ------- | -------------------- |
| `true`  | Is within expiration |
| `false` | Is expired           |

## `parseCookie()`

ESM and TypeScript friendly [`cookie.parse()`](https://github.com/jshttp/cookie#cookieparsestr-options) from [`cookie`](https://github.com/jshttp/cookie).

## `serializeCookie()`

ESM and TypeScript friendly [`cookie.serialize()`](https://github.com/jshttp/cookie#cookieserializename-value-options) from [`cookie`](https://github.com/jshttp/cookie).
