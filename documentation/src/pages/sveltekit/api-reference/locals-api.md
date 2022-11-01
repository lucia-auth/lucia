---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Locals API (server)"
---

These are available inside `locals` from SvelteKit's `ServerRequest`.

```ts
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = locals.getSession();
};
```

## `clearSession()`

Deletes all session cookies stored to the user. This will **NOT** invalidate the provided session - this can be down with [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
const setSession: () => void;
```

#### Example

```ts
import { auth } from "$lib/server/lucia";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	locals.clearSession();
};
```

## `getSession()`

Gets the validated or renewed session from the request, and returns the current session or `null` if the session id is invalid. Sessions are validated on each request and as such, `getSession()` will return that original session and will not re-validate the session id on each call. This means `setSession()` or `clearSession()` will **NOT** change the return value of this method.

```ts
const getSession: () => Session | null;
```

#### Returns

| type                                                        | description                                         |
| ----------------------------------------------------------- | --------------------------------------------------- |
| [`Session`](/reference/types/lucia-types#session)` \| null` | The session of the session id sent with the request |

#### Example

```ts
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = locals.getSession();
	if (!session) {
		// invalid
	}
};
```

## `setSession()`

Sets the session id cookie of the provided session. When called multiple times this will only set the last provided session.

```ts
const setSession: (session: Session) => void;
```

#### Parameter

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | The session to set to cookies |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = await auth.createSession();
	locals.setSession(session);
};
```
