---
order: 11
layout: "@layouts/DocumentLayout.astro"
title: "Renew session in the client"
---

You can renew the current session using [`renewSession()`](/reference/api/client-api#renewsession), exported by `lucia-sveltekit/client`.

```ts
import { renewSession } from "lucia-sveltekit/client";

await renewSession();
```