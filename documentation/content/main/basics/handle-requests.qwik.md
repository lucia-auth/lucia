---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the default [Qwik City middleware](/reference/lucia-auth/middleware#qwik), it expects Qwik City `RequestEventLoader` and `RequestEventAction`, which are passed onto `routeLoader$()` and `routeAction$()` and API route handlers.

```ts
// src/routes/index.tsx
import { auth } from "~/lib/lucia.js";
import { routeLoader$ } from "@builder.io/qwik-city";

export const useLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
});
```

```ts
// src/routes/index.tsx
import { auth } from "~/lib/lucia.js";
import { routeAction$ } from "@builder.io/qwik-city";

export const useAction = routeAction$(async (_values, event) => {
	const authRequest = auth.handleRequest(event);
});
```

### Middleware

By default, Lucia uses the [Lucia middleware](/reference/lucia-auth/middleware#lucia), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro](/reference/lucia-auth/middleware#astro)
- [Express](/reference/lucia-auth/middleware#express)
- [Node](/reference/lucia-auth/middleware#node)
- [SvelteKit](/reference/lucia-auth/middleware#sveltekit)
- [Web](/reference/lucia-auth/middleware#web)
- [Qwik City](/reference/lucia-auth/middleware#qwik)

> Use the Node middleware for Next.js

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

**We recommend sticking to `validateUser()` if you need to get the user in any part of the process.** See the section below for details.

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

## Set session cookie

[`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#validateuser) can be used to set a session, and therefore creating a session cookie.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(event);
authRequest.setSession(session);
```

You can also pass `null` to remove the current session cookie.

```ts
authRequest.setSession(null);
```

> (warn) When signing users out, remember to invalidate the current session with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession) alongside removing the session cookie!
