---
_order: 1
title: "Client auth state"
description: "Learn how to get the current Lucia auth state in the Client in SvelteKit"
---

One quick and easy way to share the auth state with the client is to have a layout load function in your route root that returns the user:

```ts
// routes/+layout.server.ts

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	return {
		user
	};
};
```

However, this is discouraged as there's no guarantee that this load function will re-run automatically on auth state change. Another reason to avoid this is that even if your route is protected and only authorized user can access it, TypeScript won't know that:

```svelte
<script lang="ts">
	import type { PageData } from "./$types";
	export let data: PageData;
	const userId = data.user?.userId; // can be undefined
</script>
```

By returning a user on each route's server load function, you can make sure that the user is always defined for protected routes.

```ts
export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (user) {
		return {
			user
		};
	}
	// redirect user, etc
};
```

```svelte
<script lang="ts">
	import type { PageData } from "./$types";
	export let data: PageData;
	const userId = data.user.userId; // always defined
</script>
```
