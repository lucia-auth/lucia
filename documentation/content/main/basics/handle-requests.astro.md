---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`]() returns [`AuthRequest`](), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the [Astro middleware](), it expects Astro's [`ApiContext`]() or [`Astro`]() global, which are available inside `.astro` pages and API routes.

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

By default, Lucia uses the [Node middleware](), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro]()
- [Express]()
- [SvelteKit]()

> Use the default middleware for Next.js

## Validate requests

[`AuthRequest.validate()`]() can be used to get the current session.

```ts
// index.astro
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(Astro);
const session = await authRequest.validate(Astro);
```

You can also use [`AuthRequest.validateUser()`]() to get both the user and session.

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

[`AuthRequest.setSession()`]() can be used to set a session, and therefore creating a session cookie.

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

> (warn) When signing users out, remember to invalidate the current session with [`invalidateSession()`]() alongside removing the session cookie!
