---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the [Astro middleware](/reference/lucia-auth/middleware#astro), it expects Astro's [`ApiContext`](https://docs.astro.build/en/reference/api-reference/#endpoint-context) or [`Astro`](https://docs.astro.build/en/reference/api-reference/#astro-global) global, which are available inside `.astro` pages and API routes.

```ts
// index.astro
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(Astro);
```

```ts
// index.ts
import { auth } from "./lucia.js";

export const get: APIRoute = async (context) => {
	const authRequest = auth.handleRequest(apiContext);
};
```

### Middleware

By default, Lucia uses the [Lucia middleware](/reference/lucia-auth/middleware#lucia), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro](/reference/lucia-auth/middleware#astro)
- [Express](/reference/lucia-auth/middleware#express)
- [Node](/reference/lucia-auth/middleware#node)
- [SvelteKit](/reference/lucia-auth/middleware#sveltekit)
- [Web](/reference/lucia-auth/middleware#web)

> Use the Node middleware for Next.js

## Validate requests

[`AuthRequest.validate()`](/reference/lucia-auth/authrequest#validate) can be used to get the current session.

```ts
// index.astro
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(Astro);
const session = await authRequest.validate(Astro);
```

You can also use [`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validateuser) to get both the user and session.

```ts
// index.astro
const { user, session } = await authRequest.validateUser(Astro);
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
// index.astro
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(Astro);
authRequest.setSession(session);
```

You can also pass `null` to remove the current session cookie.

```ts
authRequest.setSession(null);
```

> (warn) When signing users out, remember to invalidate the current session with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession) alongside removing the session cookie!
