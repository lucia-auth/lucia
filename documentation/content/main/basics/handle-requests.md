---
title: "Handle requests"
description: "Learn how to handle and validate incoming requests with Lucia"
---

Reading and parsing request headers, validating sessions, and setting appropriate response headers for every protected endpoint is a bit tedious. To address this issue, Lucia provides [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) which creates a new [`AuthRequest`](/reference/lucia/interfaces/authrequest) instance. This provides a few methods that make working with session cookies and bearer tokens easier. Refer to [Using cookies](/basics/using-cookies) and [Using bearer tokens](/basics/using-bearer-tokens) page on more about those methods.

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
	middleware: web() // pass Web middleware
});

// `Auth.handleRequest()` now accepts `Request`
const authRequest = auth.handleRequest(new Request());
```

## List of middleware

- [Astro](#astro)
- [Elysia](#elysia)
- [Express](#express)
- [Fastify](#fastify)
- [H3](#h3)
  - [Nuxt](#nuxt)
- [Hono](#hono)
- [Next.js](#nextjs)
- [Node.js](#nodejs)
- [Qwik](#qwik)
- [SvelteKit](#sveltekit)
- [Web standard](#web-standard)
  - [Remix](#remix)
  - Cloudflare workers

### Lucia (default)

The default middleware is the Lucia middleware. `Auth.handleRequest()` accepts [`RequestContext`](/reference/middleware#requestcontext).

```ts
import { lucia } from "lucia/middleware";
```

### Astro

```ts
import { astro } from "lucia/middleware";
```

```astro
---
// .astro component
const authRequest = auth.handleRequest(Astro);
---
```

```ts
// API routes and middleware
export const get = async (context) => {
	const authRequest = auth.handleRequest(context);
	// ...
};
```

We recommend storing `AuthRequest` in `locals`.

### Elysia

```ts
import { elysia } from "lucia/middleware";
```

```ts
new Elysia().get("/", async (context) => {
	const authRequest = auth.handleRequest(context);
});
```

### Express

```ts
import { express } from "lucia/middleware";
```

```ts
app.get("/", (req, res) => {
	const authRequest = auth.handleRequest(req, res);
});
```

### Fastify

```ts
import { fastify } from "lucia/middleware";
```

```ts
server.get("/"(request, reply) => {
	const authRequest = auth.handleRequest(request, reply);
});
```

### H3

```ts
import { h3 } from "lucia/middleware";
```

#### Nuxt

```ts
// api routes (server/api/index.ts)
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	// ...
});
```

### Hono

```ts
import { hono } from "lucia/middleware";
```

```ts
app.get("/", async (context) => {
	const authRequest = auth.handleRequest(context);
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
	const authRequest = auth.handleRequest(context);
};
```

```ts
// pages/index.ts
export default async (req: IncomingMessage, res: OutgoingMessage) => {
	const authRequest = auth.handleRequest({ req, res });
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

We recommend setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) configuration to `false` when using this middleware. `request` should only be set to `null` when handling GET requests (e.g. inside `page.tsx`).

```ts
// app/page.tsx
import { cookies } from "next/headers";

export default () => {
	const authRequest = auth.handleRequest({
		request: null,
		cookies
	});
	// ...
};
```

```ts
// app/routes.ts
export const GET = async (request: NextRequest) => {
	const authRequest = auth.handleRequest({
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
	const authRequest = auth.handleRequest(request);
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
```

```ts
const authRequest = auth.handleRequest(incomingMessage, outgoingMessage);
```

### Qwik

```ts
import { qwik } from "lucia/middleware";
```

```ts
const authRequest = auth.handleRequest(requestEvent as RequestEventLoader);
const authRequest = auth.handleRequest(requestEvent as RequestEventAction);
```

### SvelteKit

```ts
import { sveltekit } from "lucia/middleware";
```

```ts
// +page.server.ts
export const load = async (event) => {
	const authRequest = auth.handleRequest(event);
	// ...
};

export const actions = {
	default: async (event) => {
		const authRequest = auth.handleRequest(event);
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

const authRequest = auth.handleRequest(request as Request);
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
