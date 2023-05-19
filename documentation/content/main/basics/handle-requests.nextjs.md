---
_order: 6
title: "Handle requests"
description: "Learn how to handle requests with Lucia"
---

[`handleRequest()`](/reference/lucia-auth/auth#handlerequest) returns [`AuthRequest`](/reference/lucia-auth/authrequest), which provides a set of methods that makes it easy to validate incoming requests. It will handle session renewals for you including cookies.

The [Next.js middleware](/reference/lucia-auth/middleware#nextjs) is the recommended adapter for Next.js projects. It supports both the `pages` router and the newer App router, and as such, there are severals ways `handleRequest()` can be called. However, due to a limitation on cookies in the App router, Lucia cannot renew sessions. Refer to [Using the App router](/nextjs/app-router).

### `pages` router

```ts
// pages/index.tsx
import { auth } from "./lucia.js";

export const getServerSideProps = async (context) => {
	const authRequest = auth.handleRequest(context);
};
```

```ts
// pages/index.ts
import { auth } from "./lucia.js";

export default async (req, res) => {
	const authRequest = auth.handleRequest({ req, res });
};
```

### App router

```ts
// app/page.tsx
import { auth } from "auth/lucia.js";
import { cookies } from "next/headers";

export default () => {
	const authRequest = auth.handleRequest({
		cookies
	});
};
```

```ts
// app/routes.ts
import { auth } from "auth/lucia.js";

export const GET = async (request: Request) => {
	const authRequest = auth.handleRequest({
		request,
		cookies
	});
};
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

const authRequest = auth.handleRequest({req, res});
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
