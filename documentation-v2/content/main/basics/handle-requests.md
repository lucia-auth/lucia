---
order: 4
title: "Handle requests"
description: "Learn about how to handle incoming requests in Lucia"
---

Reading and parsing request headers, validating sessions, and setting appropriate response headers for every protected endpoint is a bit tedious. To address this issue, Lucia provides [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) which creates a new [`Auth`](/reference/lucia/interfaces/authrequest) instance. This provides a few methods that make working with session cookies and bearer tokens easier. Refer to [Using cookies](/basics/using-cookies) and [Using bearer tokens](/basics/using-bearer-tokens) page on more about those methods.

```ts
const authRequest = auth.handleRequest();

const session = authRequest.validate();
authRequest.setSession(session);

const session = authRequest.validateBearerToken();
```

However, every framework and runtime has their own representation of an incoming request and outgoing response, such as the web standard `Request`/`Response` and Node.js' `IncomingMessage`/`OutgoingMessage`. Lucia uses its own implementation of `RequestContext` as well, which is the default parameter type of `Auth.handleRequest()`. Since this is an annoying problem that is easy to solve, Lucia provides _middleware_.

Middleware allows you to pass framework and runtime specific request objects to `Auth.handleRequest`. While we provide a number of them, it's easy to create and if you do, consider contributing to the project!

```ts
import { node } from "lucia/middleware";

lucia({
	// ...
	middleware: node() // pass Node.js middleware
});

// `Auth.handleRequest()` now accepts Node.js' API
auth.handleRequest(incomingMessage, outgoingMessage);
```

## List of middleware and examples

- [Astro](#astro)
- [Express](#express)
- [H3](#h3) ([Nuxt](#nuxt))
- [Next.js](#nextjs)
- [Node.js](#nodejs)
- [Qwik](#qwik)
- [SvelteKit](#sveltekit)
- [Web standard](#web-standard) ([Remix](#remix), Cloudflare workers)

### Lucia (default)

The default middleware is the Lucia middleware. `Auth.handleRequest()` accepts [`RequestContext`](/extending-lucia/middleware-api#requestcontext).

```ts
import { lucia } from "lucia/middleware";
```

### Astro

```ts
import { astro } from "lucia/middleware";
```

```ts
// .astro component
auth.handleRequest(Astro);
```

```ts
// API routes and middleware
export const get = async (context) => {
	auth.handleRequest(context);
	// ...
};
```

We recommend storing `AuthRequest` in `locals`.

### H3

```ts
import { h3 } from "lucia/middleware";
```

#### Nuxt

```ts
// api routes (server/api/index.ts)
export default defineEventHandler(async (event) => {
	auth.handleRequest(event);
	// ...
});
```

### Express

```ts
import { express } from "lucia/middleware";
```

```ts
app.use((req, res, next) => {
	res.locals.auth = auth.handleRequest(req, res);
	next();
});
```

### Next.js

```ts
import { nextjs } from "lucia/middleware";
```

#### Pages router

```ts
// pages/index.tsx
export const getServerSideProps = async (context) => {
	auth.handleRequest(context);
};
```

```ts
// pages/index.ts
export default async (req: IncomingMessage, res: OutgoingMessage) => {
	auth.handleRequest({ req, res });
	// ...
};
```

```ts
// pages/index.ts (deployed to edge)
export default async (request: NextRequest) => {
	// `AuthRequest.setSession()` is not supported when only `Request` is passed
	auth.handleRequest(request);
	// ...
	const session = await auth.createSession({
		// ...
	});
	const sessionCookie = auth.createSessionCookie(session);
	const response = new Response(null);
	response.headers.append("Set-Cookie", sessionCookie.serialize());
};
```

#### App router

We recommend setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) configuration to `false` when using this middleware.

```ts
// app/page.tsx
import { cookies } from "next/headers";

export default () => {
	auth.handleRequest({
		request: null,
		cookies
	});
	// ...
};
```

```ts
// app/routes.ts
export const GET = async (request: NextRequest) => {
	auth.handleRequest({
		request,
		cookies
	});
	// ...
};
```

#### Middleware

```ts
// middleware.ts
export const middleware = async (request: NextRequest) => {
	// `AuthRequest.setSession()` is not supported when only `NextRequest` is passed
	auth.handleRequest(request);
	// ...
	const session = await auth.createSession({
		// ...
	});
	const sessionCookie = auth.createSessionCookie(session);
	const response = new Response(null);
	response.headers.append("Set-Cookie", sessionCookie.serialize());
};
```

### Node.js

```ts
import { node } from "lucia/middleware";

auth.handleRequest(incomingMessage, outgoingMessage);
```

### Qwik

```ts
import { qwik } from "lucia/middleware";
```

```ts
auth.handleRequest(requestEvent as RequestEventLoader);
auth.handleRequest(requestEvent as RequestEventAction);
```

### SvelteKit

```ts
import { sveltekit } from "lucia/middleware";
```

```ts
// +page.server.ts
export const load = async (event) => {
	auth.handleRequest(event);
	// ...
};

export const actions = {
	default: async (event) => {
		auth.handleRequest(event);
		// ...
	}
};
```

```ts
// hooks.server.ts
export const handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event);
	// ...
};
```

### Web standard

**[`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession) is disabled when using the `web()` middleware.** We recommend setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) configuration to `false` when using this middleware.

```ts
import { web } from "lucia/middleware";

auth.handleRequest(request as Request);
```

```ts
const authRequest = auth.handleRequest(request);
await authRequest.validate();
await authRequest.setSession(session); // error!
```

#### Remix

```ts
export const loader = async ({ request }: LoaderArgs) => {
	const authRequest = auth.handleRequest(request);
	return json({});
};
```
