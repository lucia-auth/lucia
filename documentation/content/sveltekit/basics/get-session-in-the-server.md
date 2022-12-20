---
order: 0
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

Both of these methods cache the result on the initial call. `validate()` will use the cache from `validateUser()` if it was called first. For load functions, this means you can call these methods across multiple load functions in a single request (page load) however many times you want, and it will only call the database once. Another benefit is that you don't have to wait for the parent load functions to get the current session/user, removing unnecessary waterfalls. 

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
