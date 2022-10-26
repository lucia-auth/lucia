---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Load API"
---

These can be imported from `@lucia-auth/sveltekit/load`. Should only be for non server-only functions (+page/layout.ts).

```ts
import { getUser } from "@lucia-auth/sveltekit/load";
```

## getUser

Gets the current user. This will await for parent load functions to finish when running in the server, and run immediately when running in the browser. For server load function, use [`validateRequest()`](/reference/api/server-api#validaterequest) and other server APIs.

```ts
const getUser: (event: LoadEvent) => Promise<Readonly<User> | null>;
```

#### Parameter

| name  | type        | description                                              |
| ----- | ----------- | -------------------------------------------------------- |
| event | `LoadEvent` | SvelteKit's load event, the parameter for load functions |

#### Returns

| type                                                         | description                                     |
| ------------------------------------------------------------ | ----------------------------------------------- |
| `Readonly<`[`User`](/reference/types/lucia-types)`> \| null` | Returns `null` if a current user does not exist |

#### Example

```ts
import { getUser } from "@lucia-auth/sveltekit/load";
import type { Load } from "@sveltejs/kit";

export const load: Load = async (event) => {
	const user = await getUser(event);
	if (!user) {
		// not authenticated
	}
};
```
