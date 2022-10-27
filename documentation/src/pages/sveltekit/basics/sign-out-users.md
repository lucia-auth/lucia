---
order: 4
layout: "@layouts/DocumentLayout.astro"
title: "Sign out users"
---

You can invalidate the current session and remove the session cookies from the client using [`signOut()`](/reference/api/client-api#signout), exported by `@lucia-auth/sveltekit/client`.

```ts
import { signOut } from "@lucia-auth/sveltekit/client";

await signOut();
```

You can [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) to re-run all load functions and let the load function handle the redirect. However, `invalidateAll` must be preceded by `signOut()` for it to work properly (you may refresh the entire page if you prefer not use `signOut()`).

## Example

The user will be redirected to /login on successful sign out.

```ts
import { signOut } from "@lucia-auth/sveltekit/client";

await signOut();
invalidateAll()
```
