---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

The [H3 middleware](/reference/lucia-auth/middleware#h3) is the recommended adapter for Nuxt 3.

```ts
// server/api/index.ts
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
});
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
import { h3 } from "lucia-auth/middleware";
import lucia from "lucia-auth";

const auth = lucia({
	middleware: h3()
});
```

## Validate requests

[`AuthRequest.validate()`](/reference/lucia-auth/authrequest#validate) can be used to get the current session.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest({ req, res });
const session = await authRequest.validate();
```

You can also use [`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validateuser) to get both the user and session.

```ts
const { user, session } = await authRequest.validateUser();
```

We recommend sticking to `validateUser()` if you need to get the user in any part of the process.

## Set session cookie

[`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#validateuser) can be used to set a session, and therefore creating a session cookie.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(req, res);
authRequest.setSession(session);
```

You can also pass `null` to remove the current session cookie.

```ts
authRequest.setSession(null);
```

> (warn) When signing users out, remember to invalidate the current session with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession) alongside removing the session cookie!
