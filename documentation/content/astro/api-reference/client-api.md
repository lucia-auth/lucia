---
order: 1
title: "Client API"
---

These can be imported from `@lucia-auth/astro/client`. Errors are thrown using the standard Error().

```ts
import { getUser } from "@lucia-auth/astro/client";
```

## `signOut()`

Invalidates the current session and removes all session cookies. `url` is the api route handled by [`handleLogoutRequests()`](/astro/api-reference/server-api#handlelogoutrequests).

```ts
const signOut: () => Promise<void>;
```

#### Parameter

| name | type     | description                     |
| ---- | -------- | ------------------------------- |
| url  | `string` | the url of the logout api route |

#### Error

| message | description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| unknown | failed to invalidate the current session due to network, db, or other errors |

#### Example

```ts
import { signOut } from "@lucia-auth/astro/client";

await signOut("/api/logout");
```
