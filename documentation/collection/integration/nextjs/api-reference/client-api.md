---
_order: 1
title: "Client API"
---

These can be imported from `@lucia-auth/nextjs/client`. Errors are thrown using the standard Error().

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

#### Error

| message                                                                              | description |
| ------------------------------------------------------------------------------------ | ----------- |
| unknown failed to invalidate the current session due to network, db, or other errors |

#### Example

```ts
import { signOut } from "@lucia-auth/nextjs/client";

await signOut();
```
