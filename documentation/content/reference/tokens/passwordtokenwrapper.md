---
title: "`PasswordTokenWrapper`"
_order: 1
---

All errors are thrown as [`LuciaTokenError`](/tokens/reference/luciatokenerror).

```ts
type IdTokenWrapper = Readonly<{
	getAllUserTokens: (token: string) => Promise<Token[]>;
	issue: (userId: string) => Promise<Token>;
	invalidateAllUserTokens: (userId: string) => Promise<void>;
	validate: (token: string, userId: string) => Promise<Token>;
}>;
```

## `getAllUserTokens()`

Returns all tokens, both valid and expired, of the user.

```ts
const getAllUserTokens: (userId: string) => Promise<Token[]>;
```

#### Parameters

| name   | type     | description |
| ------ | -------- | ----------- |
| userId | `string` | target user |

#### Returns

| type                                   |
| -------------------------------------- |
| [`Token`](/reference/tokens/token)`[]` |

#### Errors

| name            | description     |
| --------------- | --------------- |
| INVALID_USER_ID | invalid user id |

## `invalidateAllUserTokens()`

Invalidates all user tokens. Succeeds regardless of the validity of the user id.

```ts
const invalidateAllUserTokens: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type     | description    |
| ------ | -------- | -------------- |
| userId | `string` | target user id |

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

| type                               |
| ---------------------------------- |
| [`Token`](/reference/tokens/token) |

#### Errors

| name            | description          |
| --------------- | -------------------- |
| DUPLICATE_TOKEN | token already exists |
| INVALID_USER_ID | invalid user id      |

#### Example

```ts
const tokenHandler = idToken();

const issuedToken = await tokenHandler.issue(userId);
```

## `validate()`

Validates a token using the provided user id.

```ts
const validate: (token: string, userId: string) => Promise<Token>;
```

#### Parameters

| name   | type     | description        |
| ------ | -------- | ------------------ |
| token  | `string` | token to validate  |
| userId | `string` | owner of the token |

#### Returns

| type                               |
| ---------------------------------- |
| [`Token`](/reference/tokens/token) |

#### Errors

`EXPIRED_TOKEN` is only returned on the first try. Subsequent validation attempts will throw `INVALID_TOKEN` as the token is deleted on the first failed attempt.

| name          | description   |
| ------------- | ------------- |
| INVALID_TOKEN | invalid token |
| EXPIRED_TOKEN | expired token |

#### Example

```ts
const tokenHandler = idToken();

const issuedToken = await tokenHandler.issue(userId);
const validatedToken = await tokenHandler.validate(issuedToken.toString());
```
