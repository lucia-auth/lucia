---
title: "Lucia.readBearerToken()"
---

# `Lucia.readBearerToken()`

Method of [`Lucia`](/reference/main/Lucia). Reads the bearer token from the ` Authorization`` header. Returns  `null` if the token doesn't exist.

## Definition

```ts
function readBearerToken(authorizationHeader: string): string | null;
```

### Parameters

-   `authorizationHeader`: HTTP `Authorization` header
