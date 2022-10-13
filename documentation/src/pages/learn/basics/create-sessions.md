---
order: 3
layout: "@layouts/DocumentLayout.astro"
title: "Create Sessions"
---

Upon session creation, a new access token (as well as a refresh token) that is connected to the session will be issued. These tokens should be stored in a http-only cookie.

A new session can be created using `createSession()` method, which takes in a user id.

```ts
import { auth } from "$lib/server/lucia";

const { session, tokens } = await auth.createSession("userId");
```

## Create a new session

```ts
import { auth } from "$lib/server/lucia";

const { session, tokens } = await auth.createSession("123456");
```

## Store the tokens as cookies

The tokens has to be manually stored as cookies, and the cookie strings (array) can be accessed from `tokens.cookies`.

```ts
const { session, tokens } = await auth.createSession("123456");
const cookieStrings = tokens.cookies; // [accessTokenCookie, refreshTokenCookie]
```

Lucia provides a helper function called `setCookie` which allows you to set cookies using SvelteKit's cookie.

```ts
import { setCookie } from "lucia-sveltekit";

await setCookie(cookie, ...cookieStrings);
```

## Update the current user on the client

`createSession` creates a new session _on the server_, but the client cannot listen for server side events (including new cookies). So, the client will not automatically update the current user when a session, a user, or a cookie was modified. Both the hooks and the root layout server function must run as well for it update as well. To update the session in the client (ie. for `getUser()` to work), you must refresh the entire page. This means you have to cause a server side navigation (using `window.location.href` for example) rather than `goto()` or `invalidate()`. In short, refresh the page when you modify the session, the user, or cookies.

However, when using forms with SvelteKit's `use:enhance` form actions, the default behavior is to redirect using `goto()`. You must override this behavior if you're using forms for sign ins and account creation. Refer to [Using forms](/learn/basics/using-forms).

## Example

Make sure to spread `tokens.cookies` when calling `setCookie`. Since a new session was created, and a new cookie was set, refresh the page.

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";
import { setCookie } from "lucia-sveltekit";
import { redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ cookie }) => {
        // ...
        try {
            const { tokens } = await auth.createSession(userId);
            setCookie(cookie, ...tokens.cookies);
        } catch {
            // error
        }
        throw redirect(302, "/"); // refresh the page by redirecting the user
    },
};
```