---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Get session in the server"
---

This is for actions, standalone endpoints, and server load functions (ie. for +page.server.ts and +server.ts files).

Inside `locals`, Lucia provides [`getSession()`](/sveltekit/api-reference/locals-api#getsession) method which will validate the request and return the current session. This will also attempt to renew the session as well if the original session was invalid.

```ts
const session = await locals.getSession();
```

Alternatively, you can use [`locals.getSessionUser()`](/sveltekit/api-reference/locals-api#getsessionuser) which works similarly to `locals.getSession()` but returns both the user and session without an additional database call.

```ts
const { session, user } = await locals.getSessionUser();
```

Both of these methods cache the result on the initial call. `getSession()` will use the cache from `getSessionUser()` if it was called first. For load functions, this means you can call these methods across multiple load functions in a single request (page load) however many times you want, and it will only call the database once. Another benefit is that you don't have to wait for the parent load functions to get the current session/user, removing unnecessary waterfalls. 

## Example

```ts
// +page.server.ts
import type { Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.getSession();
		if (!session) {
			// unauthenticated
		}
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		// unauthenticated
	}
};
```

```ts
// +server.ts
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		// unauthenticated
	}
};
```
