---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Sign out users"
---

The [`signOut()`]() function exported by `@lucia-auth/nextjs/client` can be used to invalidate the current session and remove all session cookies.

```ts
import { signOut } from "@lucia-auth/nextjs/client";

await signOut();
```