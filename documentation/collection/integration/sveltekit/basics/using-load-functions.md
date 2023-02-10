---
_order: 2
title: "Load functions"
---

In general, data fetching and auth guards should be handled using server load functions, rather than shared load functions or regular endpoints.

A common pattern in SvelteKit is to get the current auth state in a layout and pass the data with page data. However, all child load functions would have to wait for the parent to resolve, causing a waterfall just by trying to get the current auth state. Ideally, you'd want to validate the request inside each load functions so they can run independently of each other, improving load times for the user.

To resolve this issue, the SvelteKit integration provides `locals.validate` and `locals.validateUser` to get the current state in a server context. Both these methods memoize the result. This means you can call these methods across multiple load functions in a single request (page load) and it will only call the database once. It allows you to share data without relying on SvelteKit's page data.

Refer to [Get Session in the server](/sveltekit/basics/get-session-in-the-server) for more about the methods.

```ts
// +page.server.ts
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) {
		// unauthenticated
	}
};
```
