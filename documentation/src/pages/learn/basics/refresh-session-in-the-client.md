---
order: 10
layout: "@layouts/DocumentLayout.astro"
title: "Refresh session in the client"
---

You can refresh the current session by making a request to one of the endpoint exposed by Lucia, or use a helper function that handles it. 

## Using a helper function

You can revoke the current session using `refreshSession()`, imported from `lucia-sveltekit/client`.

```ts
import { refreshSession } from "lucia-sveltekit/client";

await refreshSession();
```

## Using HTTP request

Alternatively you can send a POST request to the endpoint below. This will not redirect the user.

```bash
POST
/api/auth/refresh-session
```