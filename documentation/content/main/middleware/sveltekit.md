---
title: "SvelteKit"
description: "Learn how to handle requests with Lucia using the SvelteKit middleware"
---

Middleware for SvelteKit 1.x.

```ts
const handleRequest: (event: RequestEvent) => AuthRequest;
```

| name  | type                                                                          |
| ----- | ----------------------------------------------------------------------------- |
| event | [`RequestEvent`](https://kit.svelte.dev/docs/types#public-types-requestevent) |

## Example

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event);
	return await resolve(event);
};
```

```ts
// +page.server.ts
export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/login");
	return {
		user
	};
};
```
