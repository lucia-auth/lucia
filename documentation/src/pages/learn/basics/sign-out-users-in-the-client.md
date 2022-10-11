---
order: 9
layout: "@layouts/DocumentLayout.astro"
title: "Sign out users in the client"
---

You can refresh the sign out the user by making a request to one of the endpoint exposed by Lucia, or use a helper function that handles it. 

## Using a helper function

You can revoke the current session using `signOut()`, imported from `lucia-sveltekit/client`. This takes an optional parameter of a url where the user will be redirected to after sign out.

```ts
import { signOut } from "lucia-sveltekit/client";

await signOut(redirectUrl);
```

### Example

The user will be redirected to /login on successful sign out.

```ts
import { signOut } from "lucia-sveltekit/client";

await signOut("/login");
```

## Using HTTP request

Alternatively you can send a POST request to the endpoint below. This will not redirect the user.

```bash
POST
/api/auth/logout
```