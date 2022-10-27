---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Get user in the client"
---

To get the current user, import [`getUser`](/reference/api/client-api) from `@lucia-auth/sveltekit/client`. `@lucia-auth/sveltekit/load` also exports a similar function but this cannot be used inside pages.

This function will return a readable store with a value of [`User`](/reference/types/lucia-types#user), or `null` if the user doesn't exist.

```ts
import { getUser } from "@lucia-auth/sveltekit/client";

const user = getUser();
```

### Example

```svelte
<script lang="ts">
	import { getUser } from "@lucia-auth/sveltekit/client";

	const user = getUser();
	const userId = $user?.userId;
</script>
```
