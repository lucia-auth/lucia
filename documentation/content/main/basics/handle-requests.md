---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the default [Node middleware](/reference/lucia-auth/middleware#node), it expects Node's [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) and [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpoutgoingmessage).

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(incomingMessage, outgoingMessage);
```

### Middleware

By default, Lucia uses the [Lucia middleware](/reference/lucia-auth/middleware#lucia), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro](/reference/lucia-auth/middleware#astro)
- [Express](/reference/lucia-auth/middleware#express)
- [Node](/reference/lucia-auth/middleware#node)
- [SvelteKit](/reference/lucia-auth/middleware#sveltekit)
- [Web](/reference/lucia-auth/middleware#web)

> Use the Node middleware for Next.js

#### Using web standards

If you're dealing with the standard [`Request`]()/[`Response`](), you can use the `web` middleware:

```ts
import { web } from "lucia-auth/middleware";

const auth = lucia({
	adapter: web()
	// ...
});

const request = new Request();
const headers = new Headers();
const authRequest = auth.handleRequest(request, headers);
// ...
const response = new Response(null, {
	headers
});
```

## Validate requests

[`AuthRequest.validate()`](/reference/lucia-auth/authrequest#validate) can be used to get the current session.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
```

You can also use [`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validateuser) to get both the user and session.

```ts
const { user, session } = await authRequest.validateUser();
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
