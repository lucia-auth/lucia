---
title: "verifyRequestOrigin()"
---

# `verifyRequestOrigin()`

Verifies the request originates from a trusted origin by comparing the `Origin` header and host (e.g. `Host` header).

## Definition

```ts
function verifyRequestOrigin(origin: string, allowedDomains: string[]): boolean;
```

### Parameters

-   `origin`: `Origin` header
-   `allowedDomains`: Allowed request origins, full URL or URL host

## Example

```ts
import { verifyRequestOrigin } from "lucia";

// true
verifyRequestOrigin("https://example.com", ["example.com"]);
verifyRequestOrigin("https://example.com", ["https://example.com"]);

// false
verifyRequestOrigin("https://foo.example.com", ["example.com"]);
verifyRequestOrigin("https://example.com", ["foo.example.com"]);
```
