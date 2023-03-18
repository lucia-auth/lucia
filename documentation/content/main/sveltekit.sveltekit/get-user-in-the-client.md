---
_order: 1
title: "Get user in the client"
---

To get the current user, import [`getUser`](/reference/sveltekit/lucia-auth-client#getuser) from `@lucia-auth/sveltekit/client`.

This function will return a readable store with a value of [`User`](/reference/lucia-auth/types#user), or `null` if the user doesn't exist.

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
