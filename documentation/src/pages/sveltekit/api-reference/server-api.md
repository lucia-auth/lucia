---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Server API"
---

### `handleHooks()`

For the handle function in hooks. Reads the session id from cookies and validates it, attempting to renew it if the session id has expired. This also creates handles requests to Lucia's api endpoints and creates an internal global variable in the client.

```ts
const handleHooks: () => Handle;
```

#### Returns

| type     | description       |
| -------- | ----------------- |
| `Handle` | A handle function |

#### Example

```ts
import { auth } from "$lib/server/lucia";

export const handle: Handle = auth.handleHooks();
```

```ts
import { auth } from "$lib/server/lucia";
import { sequence } from "@sveltejs/kit";

export const handle: Handle = sequence(auth.handleHooks(), customHandle);
```

### `handleServerSession()`

For the root layout server load function. Reads the sessions passed on from hooks (`handleHooks()`), gets the user, and passes on to child load functions and the client. If a server load function is provided (which can return some data), Lucia will run it after it finishes handling sessions.

```ts
const handleServerSession: (serverLoad?: ServerLoad) => ServerLoad;
```

#### Parameter

| name       | type         | description            | optional |
| ---------- | ------------ | ---------------------- | -------- |
| serverLoad | `ServerLoad` | A server load function | true     |

#### Returns

| type         | description            |
| ------------ | ---------------------- |
| `ServerLoad` | A server load function |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import type { ServerLoad } from "@sveltejs/kit";

export const Load: ServerLoad = auth.handleServerSession(async (event) => {
	return {
		message: "hi"
	};
});
```