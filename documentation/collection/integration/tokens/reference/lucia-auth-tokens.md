---
title: "@lucia-auth/tokens"
_order: 0
---

These are all exported from `@lucia-auth/tokens`.

```ts
import { idToken } from "@lucia-auth/tokens";
```

## `idToken`

Creates a new [`IdTokenWrapper`](/tokens/reference/idtokenwrapper) instance.

```ts
const idToken: (
	auth: Auth,
	tokenName: string,
	option: {
		timeout: number;
		length?: number;
		generate?: (length?: number) => string;
	}
) => IdTokenWrapper;
```

#### Parameters

| name            | type                          | optional | default                                                                        | description                              |
| --------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| auth            | [`Auth`](/reference/api/auth) |          |                                                                                | initialized Lucia instance               |
| tokenName       | `string`                      |          |                                                                                | name of the token type                   |
| option.timeout  | `number`                      |          |                                                                                | how long the key is valid for in seconds |
| option.length   | `number`                      | true     | `43`                                                                           | the length of the token                  |
| option.generate | `Function`                    | true     | [`generateRandomString()`](/reference/modules/lucia-auth#generaterandomstring) | a function that returns a random string  |

#### Returns

| type                                                 |
| ---------------------------------------------------- |
| [`IdTokenWrapper`](/tokens/reference/idtokenwrapper) |

## `passwordToken`

Creates a new [`PasswordTokenWrapper`](/tokens/reference/passwordtokenwrapper) instance.

```ts
import { passwordToken } from "@lucia-auth/tokens";
import { auth } from "./lucia.js";

const tokenHandler = passwordToken(auth, tokenName, option);
```

```ts
const passwordToken: (
	auth: Auth,
	tokenName: string,
	option: {
		timeout: number;
		length?: number;
		generate?: (length?: number) => string;
	}
) => PasswordTokenWrapper;
```

#### Parameters

| name            | type                          | optional | default                                                                        | description                              |
| --------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| auth            | [`Auth`](/reference/api/auth) |          |                                                                                | initialized Lucia instance               |
| tokenName       | `string`                      |          |                                                                                | name of the token type                   |
| option.timeout  | `number`                      |          |                                                                                | how long the key is valid for in seconds |
| option.length   | `number`                      | true     | `8`                                                                            | the length of the token                  |
| option.generate | `Function`                    | true     | [`generateRandomString()`](/reference/modules/lucia-auth#generaterandomstring) | a function that returns a random string  |

#### Returns

| type                                                             |
| ---------------------------------------------------------------- |
| [`PasswordTokenWrapper`](/tokens/reference/passwordtokenwrapper) |

## `Token`

Class. Refer to [`Token`](/tokens/reference/token) for initialized instance.

```ts
const constructor: (value: string, key: Key) => Token;
```

#### Parameters

| name  | type                                    | description                  |
| ----- | --------------------------------------- | ---------------------------- |
| value | `string`                                | string value of the token    |
| key   | [`Key`](/reference/api/lucia-types#key) | the key the token references |

#### Returns

| type                               |
| ---------------------------------- |
| [`Token`](/tokens/reference/token) |

## `LuciaTokenError`

Class - extends [`Error`](https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/error). Refer to [`LuciaTokenError`](/tokens/reference/luciatokenerror) for initialized instance.

#### Parameters

| name    | type     | description           |
| ------- | -------- | --------------------- |
| message | `string` | a valid error message |

#### Returns

| type                                                   |
| ------------------------------------------------------ |
| [`LuciaTokenError`](/tokens/reference/luciatokenerror) |
