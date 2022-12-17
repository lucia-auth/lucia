---
order: 3
title: "Updating the session in the client"
---

For the session and user to update in the client, [`handleServerSession()`](/sveltekit/api-reference/server-api#handleserversession) (server layout load function) must rerun. For this to run, all load functions must be invalidated using SvelteKit's [`invalidateAll`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) or the entire page should be refreshed. This should be done whenever the session changes (sign in, sign out) or when user data is updated.

```ts
import { invalidateAll } from "$app/navigation";

const updateUserEmail = async () => {
	// ...
	invalidateAll();
};
```
