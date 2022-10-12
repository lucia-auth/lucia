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
const getUser: () => User | null;
```

#### Returns

| type           | description                                   |
| -------------- | --------------------------------------------- |
| `User \| null` | Returns null if a current user does not exist |

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
