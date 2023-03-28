---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the [SvelteKit middleware](/middleware/sveltekit), it expects SvelteKit's [`RequestEvent`](https://kit.svelte.dev/docs/types#public-types-requestevent), which is passed onto hooks, server load functions, and actions.

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

### Middleware

By default, Lucia uses the [Node middleware](/middleware/node), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro](/middleware/astro)
- [Express](/middleware/express)
- [SvelteKit](/middleware/sveltekit)

> Use the default middleware for Next.js

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

### Examples

You create a new `AuthRequest` instance, or better yet, put it inside

```ts
// +page.server.ts

export const load = async (event) => {
	const authRequest = auth.handleRequest(event);
};
```

### Caching

Both `AuthRequest.validate()` and `AuthRequest.validateUser()` caches the result (or rather promise), so you won't be calling unnecessary database calls. This also means you can these methods in parallel.

```ts
// wait for database
const session = await authRequest.validate();
// immediate response
const session = await authRequest.validate();
```

```ts
// wait for database
const session = await authRequest.validateUser();
// immediate response
const session = await authRequest.validate();
```

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
