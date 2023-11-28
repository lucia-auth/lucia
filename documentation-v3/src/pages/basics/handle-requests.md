---
layout: "@layouts/MainLayout.astro"
title: "Handle requests"
---

Reading and parsing request headers, validating sessions, and setting appropriate response headers for every protected endpoint is a bit tedious. To address this issue, Lucia provides [`Lucia.handleRequest()`]() which creates a new `AuthRequest` instance. This provides a few methods that make working with session cookies and bearer tokens easier. Refer to [Using cookies]() and [Using bearer tokens]() page on more about those methods.

```ts
const authRequest = auth.handleRequest();

const { session } = await authRequest.validate();

authRequest.setSessionCookie(session.id);

const { session } = await authRequest.validateBearerToken();
```

Parameters for `Lucia.handleRequest()` will depend on the middleware you use. We provide middleware for most popular frameworks.

```ts
import { node } from "lucia/middleware";

const auth = new Lucia(adapter, {
	middleware: node()
});

// it now accepts `IncomingMessage` and `OutgoingMessage`
const authRequest = auth.handleRequest(incomingMessage, outgoingMessage);
```

When no middleware is defined, `Lucia.handleRequest()` takes a [`RequestContext`]().

## List of middleware

- [Astro](/handle-requests/astro)
- [Elysia](/handle-requests/elysia)
- [Express]()
- [Fastify]()
- [H3]()
  - [Nuxt]()
- [Hono]()
- [Next.js (App router)]()
- [Next.js (Pages router)]()
- [Node.js]()
- [Qwik]()
- [SvelteKit]()

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

### Next.js (App router)

We recommend setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) configuration to `false` when using the Next.js App router.

```ts
// app/page.tsx
import * as context from "next/headers";

export default () => {
	const authRequest = auth.handleRequest("GET", context);

	const actions = async () => {
		// setting to POST is important!!
		const authRequest = auth.handleRequest("POST", context);
	};
	// ...
};
```

```ts
// app/routes.ts
import * as context from "next/headers";

export const POST = async (request: NextRequest) => {
	const authRequest = auth.handleRequest(request.method, context);
	// ...
};
```

### Next.js (Pages router)

```ts
import { nextjs } from "lucia/middleware";
```

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
