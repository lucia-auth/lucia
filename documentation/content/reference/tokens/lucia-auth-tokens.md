---
title: "Main (/)"
_order: 0
---

These are all exported from `@lucia-auth/tokens`.

```ts
import { idToken } from "@lucia-auth/tokens";
```

## `idToken`

Creates a new [`IdTokenWrapper`](/reference/tokens/idtokenwrapper) instance.

```ts
const idToken: (
	auth: Auth,
	tokenName: string,
	option: {
		expiresIn: number;
		length?: number;
		generate?: (length?: number) => string;
	}
) => IdTokenWrapper;
```

#### Parameters

| name             | type                                 | optional | default                                                                           | description                              |
| ---------------- | ------------------------------------ | :------: | --------------------------------------------------------------------------------- | ---------------------------------------- |
| auth             | [`Auth`](/reference/lucia-auth/auth) |          |                                                                                   | initialized Lucia instance               |
| tokenName        | `string`                             |          |                                                                                   | name of the token type                   |
| option.expiresIn | `number`                             |          |                                                                                   | how long the key is valid for in seconds |
| option.length    | `number`                             |    ✓     | `43`                                                                              | the length of the token                  |
| option.generate  | `Function`                           |    ✓     | [`generateRandomString()`](/reference/lucia-auth/lucia-auth#generaterandomstring) | a function that returns a random string  |

#### Returns

| type                                                 |
| ---------------------------------------------------- |
| [`IdTokenWrapper`](/reference/tokens/idtokenwrapper) |

## `passwordToken`

Creates a new [`PasswordTokenWrapper`](/reference/tokens/passwordtokenwrapper) instance.

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
		expiresIn: number;
		length?: number;
		generate?: (length?: number) => string;
	}
) => PasswordTokenWrapper;
```

#### Parameters

| name             | type                                 | optional | default                                                                           | description                              |
| ---------------- | ------------------------------------ | :------: | --------------------------------------------------------------------------------- | ---------------------------------------- |
| auth             | [`Auth`](/reference/lucia-auth/auth) |          |                                                                                   | initialized Lucia instance               |
| tokenName        | `string`                             |          |                                                                                   | name of the token type                   |
| option.expiresIn | `number`                             |          |                                                                                   | how long the key is valid for in seconds |
| option.length    | `number`                             |    ✓     | `8`                                                                               | the length of the token                  |
| option.generate  | `Function`                           |    ✓     | [`generateRandomString()`](/reference/lucia-auth/lucia-auth#generaterandomstring) | a function that returns a random string  |

#### Returns

| type                                                             |
| ---------------------------------------------------------------- |
| [`PasswordTokenWrapper`](/reference/tokens/passwordtokenwrapper) |

## `Token`

Refer to [`Token`](/reference/tokens/token).

#### Parameters

| name  | type                                     | description                  |
| ----- | ---------------------------------------- | ---------------------------- |
| value | `string`                                 | string value of the token    |
| key   | [`Key`](/reference/lucia-auth/types#key) | the key the token references |

#### Returns

| type                               |
| ---------------------------------- |
| [`Token`](/reference/tokens/token) |

## `TokenError`

Refer to [`LuciaTokenError`](/reference/tokens/luciatokenerror).
