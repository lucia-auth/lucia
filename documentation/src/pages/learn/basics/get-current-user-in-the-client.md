---
order: 5
layout: "@layouts/DocumentLayout.astro"
title: "Get current user in the client"
---

To get the current user, import [`getUser`](/reference/api/client-api) from `lucia-sveltekit/client`. `lucia-sveltekit/load` also exports a similar function but this cannot be used inside pages.

This function will return a readonly [`User`](/reference/types/lucia-types#user), or `null` if the user doesn't exist. Unlike <0.10.0, this function returns a plain object rather than a writable store.

```ts
import { getUser } from "lucia-sveltekit/client";

const user = getUser();
```

### Example

```svelte
<script lang="ts">
	import { getUser } from "lucia-sveltekit/client";

	const user = getUser();
	const userId = user?.userId;
</script>
```
