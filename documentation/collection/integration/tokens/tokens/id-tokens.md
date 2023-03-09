---
title: "Id tokens"
---

Id tokens are regular tokens linked to the user to identify the token holder, such as for magic links. All errors are thrown as [`LuciaError`]().

## Initialization

```ts
import { idToken } from "@lucia-auth/tokens";
import { auth } from "./lucia.js";

const tokenHandler = idToken(auth, tokenName, {
	timeout
});
```

```ts
const idToken: (
	auth: Auth,
	tokenName: string,
	option: {
		timeout: number | null;
		length?: number;
		generate?: (length?: number) => string;
	}
) => IdTokenWrapper;
```

#### Parameters

| name            | type             | optional | default                      | description                                                         |
| --------------- | ---------------- | -------- | ---------------------------- | ------------------------------------------------------------------- |
| auth            | [`Auth`]()       |          |                              | initialized Lucia instance                                          |
| tokenName       | `string`         |          |                              | name of the token type                                              |
| option.timeout  | `number \| null` |          |                              | how long the key is valid for in seconds - `null` for no expiration |
| option.length   | `number`         | true     | `43`                         | the length of the token                                             |
| option.generate | `Function`       | true     | [`generateRandomString()`]() | a function that returns a random string                             |

### `IdTokenWrapper`

See below for full documentation on each method.

```ts
type IdTokenWrapper = {
	issue: (userId: string) => Promise<Token>;
	validate: (token: string) => Promise<Token>;
	getAllUserTokens: (token: string) => Promise<Token[]>;
	invalidate: (token: string) => Promise<void>;
	invalidateAllUserTokens: (userId: string) => Promise<void>;
};
```

## `issue()`

Issues a new token for the specified user.

```ts
const issue: (userId: string) => Promise<Token>;
```

#### Parameters

| name   | type     | description               |
| ------ | -------- | ------------------------- |
| userId | `string` | user to link the token to |

#### Returns

| type        |
| ----------- |
| [`Token`]() |

#### Errors

| name                 | description     |
| -------------------- | --------------- |
| AUTH_INVALID_USER_ID | invalid user id |

#### Example

```ts
const tokenHandler = idToken();

const issuedToken = await tokenHandler.issue(userId);
```

## `validate()`

Validates a token.

```ts
const validate: (token: string) => Promise<Token>;
```

#### Parameters

| name  | type     | description       |
| ----- | -------- | ----------------- |
| token | `string` | token to validate |

#### Returns

| type        |
| ----------- |
| [`Token`]() |

#### Errors

| name                | description   |
| ------------------- | ------------- |
| AUTH_INVALID_KEY_ID | invalid token |
| AUTH_EXPIRED_KEY    | expired token |

#### Example

```ts
const tokenHandler = idToken();

const issuedToken = await tokenHandler.issue(userId);
const validatedToken = await tokenHandler.validate(issuedToken.toString());
```
