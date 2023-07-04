---
_order: 0
title: "Main (/)"
---

These can be imported from `lucia-auth` and should only be used inside a server context.

```ts
import { generateRandomString } from "lucia-auth";
```

For exported types, refer to [Public types](/reference/lucia-auth/types).

## `generateRandomString()`

Generates a random string of a defined length without special characters based on [`nanoid`](https://github.com/ai/nanoid). The output is cryptographically random.

```ts
const generateRandomString: (length: number, alphabet?: string) => string;
```

Uses the following characters (uppercase, lowercase, numbers):

```
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
```

#### Parameter

| name     | type     | description                                   | optional | introduced |
| -------- | -------- | --------------------------------------------- | :------: | ---------- |
| length   | `number` | the length of the output string               |          |            |
| alphabet | `string` | a string from which to pick random characters |    ✓     | `1.1.0`    |

#### Returns

| type     | description                 |
| -------- | --------------------------- |
| `string` | a randomly generated string |

#### Example

```ts
// 8 char password consisting of 0-9
const randomPassword = generateRandomString(8, "0123456789");
```

#### Example

```ts
const auth = lucia(configs);
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

| name   | type                                                         | description                                     |
| ------ | ------------------------------------------------------------ | ----------------------------------------------- |
| config | [`Configuration`](/reference/lucia-auth/types#configuration) | refer to [Configuration](/basics/configuration) |

#### Returns

| type                                 |
| ------------------------------------ |
| [`Auth`](/reference/lucia-auth/auth) |

## `LuciaError`

Refer to [Error reference](/reference/lucia-auth/luciaerror).

## `SESSION_COOKIE_NAME`

The name of the session cookie.

```ts
const SESSION_COOKIE_NAME: string;
```
