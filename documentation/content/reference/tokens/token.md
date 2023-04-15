---
title: "`Token`"
_order: 1
---

Represents a token.

```ts
type Token = Readonly<{
	expiresAt: Date | null;
	userId: string;
	expired: boolean;
	toString: () => string;
}>;
```

## Properties

| name      | type           | description                                           |
| --------- | -------------- | ----------------------------------------------------- |
| expiresAt | `Date \| null` | expiration time of the token, `null` if no expiration |
| userId    | `userId`       | the user the token belongs to                         |
| expired   | `boolean`      |                                                       |

## `toString()`

Returns the stringified value of token.

```ts
const toString: () => string;
```

#### Returns

| type     |
| -------- |
| `string` |
