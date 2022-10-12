---
order: 9
layout: "@layouts/DocumentLayout.astro"
title: "Sign out users in the client"
---

You can revoke the current session using `signOut()`, imported from `lucia-sveltekit/client`. This takes an optional parameter of a url where the user will be redirected to after sign out.

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