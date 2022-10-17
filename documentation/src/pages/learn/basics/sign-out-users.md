---
order: 10
layout: "@layouts/DocumentLayout.astro"
title: "Sign out users"
---

You can invalidate the current session in the client using [`signOut()`](/reference/api/client-api#signout), exported by `lucia-sveltekit/client`. This takes an optional parameter of a url where the user will be redirected to after sign out.

```ts
import { signOut } from "lucia-sveltekit/client";

await signOut(redirectUrl);
```

## Example

The user will be redirected to /login on successful sign out.

```ts
import { signOut } from "lucia-sveltekit/client";

await signOut("/login");
```
