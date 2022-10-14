---
order: 2
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

| type                                                  | description                                   |
| ----------------------------------------------------- | --------------------------------------------- |
| `Readonly<`[`User`](/reference/types/lucia-types#user)`> \| null` | Returns null if a current user does not exist |

#### Example

```ts
import { getUser } from "lucia-sveltekit/client";

const user = getUser();
const userId = user?.userId;
```

## refreshSession()

Refreshes the current session.

```ts
const refreshSession: () => Promise<number>;
```

#### Returns

| type     | description                                        |
| -------- | -------------------------------------------------- |
| `number` | The expiration time (Unix time) of the new session |

#### Errors

| name                       | description                            |
| -------------------------- | -------------------------------------- |
| AUTH_INVALID_REFRESH_TOKEN | Invalid refresh token                  |
| DATABASE_UPDATE_FAILED     | Failed to update database              |
| DATABASE_FETCH_FAILED      | Failed to fetch data from the database |
| UNKNOWN_ERROR              |                                        |

#### Example

```ts
import { refreshSession } from "lucia-sveltekit/client";

try {
    await refreshSession();
} catch {
    // error
}
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

| name                      | description          |
| ------------------------- | -------------------- |
| AUTH_INVALID_ACCESS_TOKEN | Unauthorized request |
| UNKNOWN_ERROR             |                      |

#### Example

```ts
import { signOut } from "lucia-sveltekit/client";

await signOut("/login");
```
