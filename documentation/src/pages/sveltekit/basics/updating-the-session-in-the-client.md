---
order: 3
layout: "@layouts/DocumentLayout.astro"
title: "Updating the session in the client"
---

For the session and user to update in the client, [`handleServerSession()`]() (server layout load function) must rerun. For this to run, all load functions must be invalidated using SvelteKit's [`invalidateAll`]() or the entire page should be refreshed. This should be done whenever the session changes: sign in, user data update, sign outs, etc.

```ts
import { invalidateAll } from "$app/navigation";

const updateUserEmail = async () => {
	// ...
	invalidateAll();
};
```
