---
_order: 2
title: "Sign out users"
description: "Learn how to sign out users in the "
---

The [`signOut()`](/reference/nextjs/lucia-auth-nextjs-client#signout) function exported by `@lucia-auth/nextjs/client` can be used to invalidate the current session and remove all session cookies. This can only be called in the client as it relies on the native `fetch` API.

```ts
import { signOut } from "@lucia-auth/nextjs/client";

await signOut();
```
