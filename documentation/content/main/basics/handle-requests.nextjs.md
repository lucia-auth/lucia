---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

With the default [Node middleware](/middleware/node), it expects Next.js `NextApiRequest` and `NextApiResponse`, which are passed onto `getServerSideProps()` and API route handlers.

```ts
// pages/index.tsx
import { auth } from "./lucia.js";

export const getServerSideProps = async (context) => {
	const authRequest = auth.handleRequest(context.req, context.res);
};
```

```ts
// pages/index.ts
import { auth } from "./lucia.js";

export default async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
};
```

### Middleware

By default, Lucia uses the [Lucia middleware](/middleware/lucia), but this can be changed by providing a middleware. Lucia out of the box provides middleware for:

- [Astro](/middleware/astro)
- [Express](/middleware/express)
- [Node](/middleware/node)
- [SvelteKit](/middleware/sveltekit)

> Use the Node middleware for Next.js

## Validate requests

[`AuthRequest.validate()`](/reference/lucia-auth/authrequest#validate) can be used to get the current session.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest(req, responseres);
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

const authRequest = auth.handleRequest(req, res);
authRequest.setSession(session);
```

You can also pass `null` to remove the current session cookie.

```ts
authRequest.setSession(null);
```

> (warn) When signing users out, remember to invalidate the current session with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession) alongside removing the session cookie!
