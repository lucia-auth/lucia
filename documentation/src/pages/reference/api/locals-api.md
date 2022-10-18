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
