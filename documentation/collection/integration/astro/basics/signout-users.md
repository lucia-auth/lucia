---
_order: 2
title: "Sign out users"
---

The [`signOut()`](/astro/api-reference/client-api#signout) function exported by `@lucia-auth/astro/client` can be used to invalidate the current session and remove all session cookies. The input url is the api route that handles sign outs via [`handleLogoutRequests()`](/astro/api-reference/server-api#handlelogoutrequests)

```ts
import { signOut } from "@lucia-auth/astro/client";

await signOut("/api/logout");
```