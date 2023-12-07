---
layout: "@layouts/ReferenceLayout.astro"
type: "method"
---

Reads the session cookie from the `Cookie` header. Returns `null` if the cookie doesn't exist.

## Definition

```ts
function readSessionCookie(cookieHeader: string): string | null
```

### Parameters

- `cookieHeader`: HTTP `Cookie` header
