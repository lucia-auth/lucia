---
_order: 3
title: "`LuciaError`"
---

All [known errors](/basics/error-handling#known-errors) are thrown as `LuciaError`, which is a standard `Error` :

```ts
class LuciaError extends Error {}
```

## properties

### `message`

The error message.

```ts
const error: LuciaError;
const errorMessage = error.message;
```

| messages                                |
| --------------------------------------- |
| `AUTH_INVALID_SESSION_ID`               |
| `AUTH_INVALID_PASSWORD`                 |
| `AUTH_OUTDATED_PASSWORD`                |
| `AUTH_INVALID_KEY_ID`                   |
| `AUTH_DUPLICATE_KEY_ID`                 |
| `AUTH_INVALID_REQUEST`                  |
| `AUTH_INVALID_USER_ID`                  |
| `AUTH_NOT_AUTHENTICATED`                |
| `AUTH_DUPLICATE_SESSION_ID`             |
| `AUTO_USER_ID_GENERATION_NOT_SUPPORTED` |
| `AUTH_EXPIRED_KEY`                      |
| `REQUEST_UNAUTHORIZED`                  |
| `UNKNOWN_ERROR`                         |
