---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Errors"
---

A list of error messages, which can be accessed with `.message`.

```ts
const error: LuciaError;
const errorMessage = error.message;
```

| name                         |
| ---------------------------- |
| `AUTH_INVALID_SESSION_ID`    |
| `AUTH_INVALID_PASSWORD`      |
| `AUTH_OUTDATED_PASSWORD`     |
| `AUTH_INVALID_PROVIDER_ID`   |
| `AUTH_DUPLICATE_USER_DATA`   |
| `AUTH_DUPLICATE_PROVIDER_ID` |
| `AUTH_INVALID_REQUEST`       |
| `AUTH_INVALID_USER_ID`       |
| `AUTH_NOT_AUTHENTICATED`     |
| `AUTH_DUPLICATE_SESSION_ID`  |
| `DATABASE_FETCH_FAILED`      |
| `DATABASE_UPDATE_FAILED`     |
| `REQUEST_UNAUTHORIZED`       |
| `UNKNOWN_ERROR`              |
