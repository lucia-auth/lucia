---
order: 3
layout: "@layouts/DocumentLayout.astro"
title: "Client API"
---

These can be imported from `@lucia-auth/sveltekit/client`. Can only be used inside pages (+page.svelte).

```ts
import { getUser } from "@lucia-auth/sveltekit/client";
```

## `getUser()`

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
import { getUser } from "@lucia-auth/sveltekit/client";

const user = getUser();
const userId = user?.userId;
```

## `handleSession()`

Handles sessions in the client - must be called on the root layout for all client and load methods to work. This will sync the global client state with the server's and listen for session state change across tabs.

```ts
const handleSession: (
	pageStore: Readable<{
		data: Record<string, any>;
	}>
) => void;
```

#### Parameter

| name      | type            | description |
| --------- | --------------- | ----------- |
| pageStore | [`PageStore`]() | Page store  |

## `signOut()`

Deletes the local session cache, invalidates the user's session, and removes session cookies. 

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
import { signOut } from "@lucia-auth/sveltekit/client";

await signOut("/login");
```
