---
order: 3
layout: "@layouts/DocumentLayout.astro"
title: "Client API"
---

These can be imported from `lucia-sveltekit/client`. Can only be used inside pages (+page.svelte).

```ts
import { getUser } from "lucia-sveltekit/client";
```

## getUser()

Gets the current user.

```ts
const getUser: () => Readonly<User> | null;
```

#### Returns

| type                                                              | description                                   |
| ----------------------------------------------------------------- | --------------------------------------------- |
| `Readonly<`[`User`](/reference/types/lucia-types#user)`> \| null` | Returns null if a current user does not exist |

#### Example

```ts
import { getUser } from "lucia-sveltekit/client";

const user = getUser();
const userId = user?.userId;
```

## signOut()

Signs the user out the current session. Refresh the page for the current state to update.

```ts
const signOut: (redirect?: string) => Promise<void>;
```

#### Parameter

| name     | type     | description                                      | optional |
| -------- | -------- | ------------------------------------------------ | -------- |
| redirect | `string` | The url to redirect to after a successful logout | true     |

#### Errors

| name                    | description          |
| ----------------------- | -------------------- |
| AUTH_INVALID_SESSION_ID | Unauthorized request |
| UNKNOWN_ERROR           |                      |

#### Example

```ts
import { signOut } from "lucia-sveltekit/client";

await signOut("/login");
```
