---
_order: 0
title: "Server API"
---

These can be imported from `@lucia-auth/sveltekit`.

```ts
import { handleHooks } from "@lucia-auth/sveltekit";
```

## `handleHooks()`

For the handle function in hooks. Sets the `locals` methods, handles requests to Lucia's api endpoints, and creates a global variable in the client for internal use.

```ts
const handleHooks: (auth: Auth) => Handle;
```

#### Parameter

| name | type                                        | description    |
| ---- | ------------------------------------------- | -------------- |
| auth | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance |

#### Returns

| type     | description       |
| -------- | ----------------- |
| `Handle` | a handle function |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import { handleHooks } from "@lucia-auth/sveltekit";

export const handle = handleHooks(auth);
```

```ts
import { auth } from "$lib/server/lucia";
import { handleHooks } from "@lucia-auth/sveltekit";
import { sequence } from "@sveltejs/kit";

export const handle = sequence(handleHooks(auth), customHandle);
```

## `handleServerSession()`

For the root layout server load function. Reads the sessions passed on from hooks (`handleHooks()`), gets the user, and passes on to child load functions and the client. If a server load function is provided (which can return data and be properly typed), Lucia will run it after it finishes handling sessions.

```ts
const handleServerSession: (serverLoad?: ServerLoad) => ServerLoad;
```

#### Parameter

| name       | type         | description            | optional |
| ---------- | ------------ | ---------------------- | -------- |
| serverLoad | `ServerLoad` | a server load function | true     |

#### Returns

| type         | description            |
| ------------ | ---------------------- |
| `ServerLoad` | a server load function |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import { handleServerSession } from "@lucia-auth/sveltekit";
import type { LayoutServerLoadEvent } from "$./types";

export const Load = handleServerSession(async (event: LayoutServerLoadEvent) => {
	return {
		message: "hi"
	};
});
```
