---
order: 11
layout: "@layouts/DocumentLayout.astro"
title: "Refresh session in the client"
---

You can revoke the current session using `refreshSession()`, imported from `lucia-sveltekit/client`.

```ts
import { refreshSession } from "lucia-sveltekit/client";

await refreshSession();
```