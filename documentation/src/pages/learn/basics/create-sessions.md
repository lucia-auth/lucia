---
order: 3
layout: "@layouts/DocumentLayout.astro"
title: "Create Sessions"
---

A new session can be created using [`createSession()`](/reference/api/server-api#createsession) method, which takes a user id. After creating a new session, the id of the session should be stored as a http-only cookie.

```ts
import { auth } from "$lib/server/lucia";

const session = await auth.createSession("userId");
```

## Create a new session

```ts
import { auth } from "$lib/server/lucia";

try {
    const session = await auth.createSession("123456");
} catch {
    // invalid user id
}
```

## Store the tokens as cookies

The tokens should be manually stored as a cookie using `setSession()` method available inside `locals`, which takes the returned `Session`.

```ts
const session = await auth.createSession("123456");
locals.setSession(session);
```

## Update the current user on the client

`createSession` creates a new session _on the server_, but the client cannot listen for server side events (including new cookies). So, the client will not automatically update the current user when a session, a user, or a cookie was modified. Both the hooks and the root layout server function must run as well for it update as well. To update the session in the client (ie. for [`getUser()`](/reference/api/client-api#getuser) to work), you must refresh the entire page. This means you have to cause a server side navigation (using `window.location.href` for example) rather than [`goto()`](https://kit.svelte.dev/docs/modules#$app-navigation-goto) or [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall). In short, refresh the page when you modify the session, the user, or cookies.

However, when using forms with SvelteKit's [`use:enhance`](https://kit.svelte.dev/docs/modules#$app-forms-enhance) form actions, the default behavior is to redirect using `goto()`. You must override this behavior if you're using forms for sign ins and account creation. Refer to [Using forms](/learn/basics/using-forms).

## Example

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";
import { setCookie } from "lucia-sveltekit";
import { redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ locals }) => {
        // ...
        try {
            const session = await auth.createSession(userId);
            locals.setSession(session);
        } catch {
            // error
        }
        throw redirect(302, "/"); // refresh the page by redirecting the user
    },
};
```
