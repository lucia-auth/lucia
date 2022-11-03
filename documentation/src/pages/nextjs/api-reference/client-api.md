---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Client API"
---

These can be imported from `@lucia-auth/nextjs/client`.

```ts
import { getUser } from "@lucia-auth/nextjs/client";
```

## `getUser()`

Gets the current user using a fetch request.

```ts
const getUser: () => Promise<User | null>;
```

#### Returns

| type                                                  | description               |
| ----------------------------------------------------- | ------------------------- |
| [`User`](/reference/types/lucia-types#user)` \| null` | `null` if unauthenticated |

#### Example

```ts
import { getUser } from "@lucia-auth/nextjs/client";
const user = await getUser();
```

## `signOut()`

Invalidates the current session and removes all session cookies.

```ts
const signOut: () => Promise<void>;
```

#### Example

```ts
import { signOut } from "@lucia-auth/nextjs/client";

await signOut();
```
