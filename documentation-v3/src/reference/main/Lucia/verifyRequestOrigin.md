---
type: "method"
---

Verifies if the hostname request origin matches one of:

1. Hostname of the HTTP header value defined in the `csrfProtection` options in [`Lucia`](ref:main) (default: `Host`)
2. Hostname of domains defined in the `csrfProtection` options in [`Lucia`](ref:main)

## Definition

```ts
//$ Headers=https://developer.mozilla.org/en-US/docs/Web/API/Headers
function verifyRequestOrigin(headers: $$Headers): boolean;
```

### Parameters

- `headers`: HTTP request headers
