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

Deletes the session cookie if it exists.

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

Gets the session from the request. This will be from the session id sent with the request, or renewed session if the one sent was idle. Returns `null` if invalid.

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

Sets the session as a cookie.

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
