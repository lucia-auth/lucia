---
_order: 0
title: "lucia-auth"
---

These can be imported from `lucia-auth` and should only be used inside a server context.

```ts
import { generateRandomString } from "lucia-auth";
```

## `lucia()`

Creates a new `Auth` instance.

```ts
const lucia: (config: Configuration) => Auth;
```

This is exported as default:

```ts
import lucia from "lucia-auth";
import { default as lucia } from "lucia-auth";
```

#### Parameter

| name   | type            | description                                                                                         |
| ------ | --------------- | --------------------------------------------------------------------------------------------------- |
| config | `Configuration` | options for Lucia - refer to [Lucia configurations](/reference/configurations/lucia-configurations) |

#### Returns

| type                              |
| --------------------------------- |
| [`Auth`](/reference/api/api#auth) |

## `generateRandomString()`

Generates a random string of a defined length using [`nanoid`](https://github.com/ai/nanoid) without special characters. The output is cryptographically random.

```ts
const generateRandomString: (length: number) => string;
```

Uses the following characters (uppercase, lowercase, numbers):

```
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
```

#### Parameter

| name   | type     | description                     |
| ------ | -------- | ------------------------------- |
| length | `number` | the length of the output string |

#### Returns

| type     | description                 |
| -------- | --------------------------- |
| `string` | a randomly generated string |

#### Example

```ts
const randomString = generateRandomString(8);
```

#### Example

```ts
const auth = lucia(configs);
```

## `LuciaError`

Refer to [Error reference](/reference/types/errors).

```ts
class LuciaError extends Error {}
```

## `SESSION_COOKIE_NAME`

The name of the session cookie.

```ts
const SESSION_COOKIE_NAME: string;
```
