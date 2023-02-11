---
_order: 0
title: "Get session in the server"
---

This is for actions, standalone endpoints, and server load functions (ie. for +page.server.ts and +server.ts files).

Inside `locals`, Lucia provides [`validate()`](/sveltekit/api-reference/locals-api#validate) method which will validate the request and return the current session. This will also attempt to renew the session as well if the original session was invalid.

```ts
const session = await locals.validate();
```

Alternatively, you can use [`locals.validateUser()`](/sveltekit/api-reference/locals-api#validateuser) which works similarly to `locals.validate()` but returns both the user and session without an additional database call.

```ts
const { session, user } = await locals.validateUser();
```

> Refer to [Load functions](/sveltekit/basics/load-functions) to learn more about using load functions with Lucia.

## Example

```ts
// +page.server.ts
import type { Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.validate();
		if (!session) {
			// unauthenticated
		}
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) {
		// unauthenticated
	}
};
```

```ts
// +server.ts
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) {
		// unauthenticated
	}
};
```
