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
import { astro } from "lucia-auth/middleware";
import lucia from "lucia-auth";

const auth = lucia({
	middleware: astro()
});
```

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
