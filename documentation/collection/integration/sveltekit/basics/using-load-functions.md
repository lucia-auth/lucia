---
_order: 2
title: "Using load functions"
---

Lucia for SvelteKit does not support shared load functions (`+page/layout.ts`) and you cannot get the current user inside it. However, we do support *server* load functions (`+page/layout.server.ts`) and that should be used instead. In most cases, you're fetching some data about or related to the user, which will require authorization in the server even when navigating client side. Using server load functions has it's benefits as well. You won't have to wait for the parent load function to get the current user, which means no waterfall (load functions running in sequence and not parallel) and thus faster load times for the user. The method used to get the current session also caches the result, meaning only a single database call is made regardless of the number of times you use it in a single page load (sequence of load functions). 

Refer to [Get session in the server](/sveltekit/basics/get-session-in-the-server) for documentation.

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
