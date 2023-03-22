---
title: "Token"
_order: 1
---

Represents a token.

```ts
type Token = Readonly<{
	expires: Date | null;
	userId: string;
	isExpired: boolean;
	toString: () => string;
}>;
```

## Properties

| name      | type           | description                                           |
| --------- | -------------- | ----------------------------------------------------- |
| expires   | `Date \| null` | expiration time of the token, `null` if no expiration |
| userId    | `userId`       | the user the token belongs to                         |
| isExpired | `boolean`      |                                                       |

## `toString()`

Returns the stringified value of token.

```ts
const toString: () => string;
```

#### Returns

| type     |
| -------- |
| `string` |
