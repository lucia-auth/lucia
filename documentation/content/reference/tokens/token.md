---
title: "Token"
_order: 1
---

Represents a token.

```ts
type Token = Readonly<{
	expires: Date | null;
	userId: string;
	isExpired: () => boolean;
	toString: () => string;
}>;
```

## Properties

| name    | type           | description                                           |
| ------- | -------------- | ----------------------------------------------------- |
| expires | `Date \| null` | expiration time of the token, `null` if no expiration |
| userId  | `userId`       | the user the token belongs to                         |

## `isExpired()`

Returns whether the token is expired or not. **Should not be used for authentication or authorization.**

```ts
const isExpired: () => boolean;
```

#### Returns

| type      | description       |
| --------- | ----------------- |
| `boolean` | `true` if expired |

## `toString()`

Returns the stringified value of token.

```ts
const toString: () => string;
```

#### Returns

| type     |
| -------- |
| `string` |
