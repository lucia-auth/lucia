---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the [SvelteKit middleware](/reference/lucia-auth/middleware#sveltekit), it expects SvelteKit's [`RequestEvent`](https://kit.svelte.dev/docs/types#public-types-requestevent), which is passed onto hooks, server load functions, and actions.

```ts
import { auth } from "./lucia.js";

export const load = async (event) => {
	const authRequest = auth.handleRequest(event);
};
```

### Using hooks

We recommend using `locals` to store `AuthRequest` rather than creating a new instance on every load function:

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event);
	return await resolve(event);
};
```

```ts
// +page.server.ts
import { auth } from "./lucia.js";

export const load = async ({ locals }) => {
	const authRequest = locals.auth;
};
```

## Middleware

By default, Lucia uses the [Lucia middleware](/reference/lucia-auth/middleware#lucia), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro](/reference/lucia-auth/middleware#astro)
- [Express](/reference/lucia-auth/middleware#express)
- [H3](/reference/lucia-auth/middleware#h3)
- [Next.js](/reference/lucia-auth/middleware#nextjs)
- [Node](/reference/lucia-auth/middleware#node)
- [SvelteKit](/reference/lucia-auth/middleware#sveltekit)
- [Web](/reference/lucia-auth/middleware#web)
- [Qwik City](/reference/lucia-auth/middleware#qwik)

> Use the Web middleware for Remix

### Configure

The middleware can be configured with the [`middleware`](/basics/configuration#middleware) config.

```ts
import { sveltekit } from "lucia-auth/middleware";
import lucia from "lucia-auth";

const auth = lucia({
	middleware: sveltekit()
});
```

## Validate requests

[`AuthRequest.validate()`](/reference/lucia-auth/authrequest#validate) can be used to get the current session.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(event);
const session = await authRequest.validate();
```

You can also use [`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validateuser) to get both the user and session.

```ts
const { user, session } = await authRequest.validateUser();
```

**We recommend sticking to only `validateUser()` in load functions if you need to get the user in any part of the process.** See the "Caching" section below for details.

#### Examples

You create a new `AuthRequest` instance, or better yet, put it inside `locals` in the hooks handle.

```ts
// +page.server.ts

export const load = async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
};
```

### Caching

Both `AuthRequest.validate()` and `AuthRequest.validateUser()` caches the result (or rather promise), so you won't be making unnecessary database calls.

```ts
// wait for database
await authRequest.validate();
// immediate response
await authRequest.validate();
```

```ts
// wait for database
await authRequest.validateUser();
// immediate response
await authRequest.validateUser();
```

This functionality works when calling them in parallel as well.

```ts
// single db call
await Promise.all([authRequest.validate(), authRequest.validate()]);
```

It also shares the result, so calling `validate()` will return the session portion of the result from `validateUser()`.

```ts
// wait for database
await authRequest.validateUser();
// immediate response
await authRequest.validate();
```

The same is not true for the other way around. `validateUser()` will wait for `validate()` to resolve and then get the user from the returned session.

```ts
// wait for database
await authRequest.validate();
// fetch user
await authRequest.validateUser();
```

As such, we recommend only using `validateUser()` inside load functions if you need the user in any part of the loading process.

## Set session cookie

[`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#validateuser) can be used to set a session, and therefore creating a session cookie.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
authRequest.setSession(session);
```

You can also pass `null` to remove the current session cookie.

```ts
authRequest.setSession(session);
```

> (warn) When signing users out, remember to invalidate the current session with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession) alongside removing the session cookie!
