---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Get user in shared load functions"
---

This page is for normal load functions, and not _server_ load functions. For server load functions, refer to [Validate server requests](/learn/basics/validate-server-requests).

To get the current user, import [`getUser`](/reference/api/load-api) from `lucia-sveltekit/load`. `lucia-sveltekit/client` also exports a similar function but this cannot be used in the load function. This function takes in the load function event, and returns a readonly [`User`](/reference/types/lucia-types#user), or `null` if the user does not exist.

This function will await for parent load functions to finish when running in the server, and run immediately when running in the browser. This reduces unnecessary waterfalls when loading pages.

```ts
import { getUser } from "lucia-sveltekit/load";

const user = await getUser(event);
```

## Example

```ts
// +page.ts
import { getUser } from "lucia-sveltekit/load";
import type { Load } from "@sveltejs/kit";

export const load: Load = async (event) => {
	const user = await getUser(event);
	if (!user) {
		// not authenticated
	}
};
```
