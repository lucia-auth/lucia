---
title: "`LuciaTokenError`"
_order: 1
---

Extends the standard [`Error`](https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/error).

```ts
type LuciaTokenError = Error;
```

## Properties

| name    | type     | description               |
| ------- | -------- | ------------------------- |
| message | `string` | error message (see below) |

### `message`

| messages          |
| ----------------- |
| `INVALID_TOKEN`   |
| `EXPIRED_TOKEN`   |
| `INVALID_USER_ID` |
| `DUPLICATE_TOKEN` |
