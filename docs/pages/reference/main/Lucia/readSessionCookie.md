---
title: "Lucia.readSessionCookie()"
---

# `Lucia.readSessionCookie()`

Method of [`Lucia`](/reference/main/Lucia). Reads the session cookie from the `Cookie` header. Returns `null` if the cookie doesn't exist.

## Definition

```ts
function readSessionCookie(cookieHeader: string): string | null;
```

### Parameters

- `cookieHeader`: HTTP `Cookie` header
