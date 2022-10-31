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

Handles sessions in the client - must be called on the root layout for all client and load methods to work. This will listen for session updates across tabs. The provided callback will be called whenever a session changes in a different tab.

```ts
const handleSession: (pageStore: Page, onSessionUpdate?: () => void) => void;
```

#### Parameter

| name            | type                                                          | description                                               | optional |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------------- | -------- |
| pageStore       | [`Page`](https://kit.svelte.dev/docs/types#sveltejs-kit-page) | Page store                                                |          |
| onSessionUpdate | `Function`                                                    | A callback function that will be called on session update | true     |

#### Example

```ts
import { page } from "$app/stores";
import { handleSession } from "@lucia-auth/sveltekit/client";

handleSession(page, () => {
	alert("Your session has been updated - please refresh the page");
});
```

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
