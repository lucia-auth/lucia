---
order: 6
layout: "@layouts/DocumentLayout.astro"
title: "Get current user in load functions"
---

This page is for normal load functions, and not _server_ load functions.

To get the current user, import `getUser` from `lucia-sveltekit/load`. `lucia-sveltekit/client` also exports a similar function but this cannot be used in the load function. This function takes in the load function event, and returns a readonly `User`, or `null` if the user does not exist.

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
