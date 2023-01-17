---
_order: 4
title: "Sign out users"
---

You can invalidate the current session and remove the session cookies from the client using [`signOut()`](/sveltekit/api-reference/client-api#signout), exported by `@lucia-auth/sveltekit/client`. This can only be called in the client (`+page.svelte`) as it relies on the native `fetch` API.

```ts
import { signOut } from "@lucia-auth/sveltekit/client";

await signOut();
```

You can use [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) to re-run all load functions and let the load functions handle the redirect.

## Example

This will redirect the user to /login on successful sign out.

```ts
import { signOut } from "@lucia-auth/sveltekit/client";

await signOut();
invalidateAll();
```
