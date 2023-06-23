---
order: 1
title: "/middleware"
format: "code"
---

## `astro()`

Middleware for Astro 1.x and 2.x.

```ts
const astro: Middleware;
```

#### Usage

```ts
auth.handleRequest(context as APIContext);
```

| name      | type                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context` | [`APIContext`](https://docs.astro.build/en/reference/api-reference/#endpoint-context)`\|`[`Astro`](https://docs.astro.build/en/reference/api-reference/#astro-global) |

```ts
import { astro } from "lucia-auth/middleware";

const auth = lucia({
	middleware: astro()
	// ...
});
```

## `express()`

Middleware for Express 4.x and 5.x.

```ts
const express: () => Middleware;
```

#### Usage

```ts
import { express } from "lucia-auth/middleware";

const auth = lucia({
	middleware: express()
	// ...
});
```

```ts
auth.handleRequest(request as Request, response as Response);
```

| name       | type                                                   |
| ---------- | ------------------------------------------------------ |
| `request`  | [`Request`](https://expressjs.com/en/4x/api.html#req)  |
| `response` | [`Response`](https://expressjs.com/en/4x/api.html#res) |

## `lucia()`

The default middleware.

```ts
const lucia: () => Middleware;
```

#### Usage

```ts
import { lucia as luciaMiddleware } from "lucia-auth/middleware";

const auth = lucia({
	middleware: luciaMiddleware()
	// ...
});
```

```ts
auth.handleRequest(requestContext as RequestContext);
```

| name             | type                                                           |
| ---------------- | -------------------------------------------------------------- |
| `requestContext` | [`RequestContext`](/reference/lucia-auth/types#requestcontext) |

## `nextjs()`

Middleware for Next.js v12 and v13 - supports both `pages` and `app` directory.

```ts
const nextjs: () => Middleware;
```

#### Usage

```ts
import { nextjs } from "lucia-auth/middleware";

const auth = lucia({
	middleware: nextjs()
	// ...
});
```

```ts
auth.handleRequest({
	req: req as IncomingMessage,
	res: res as OutgoingMessage
});

auth.handleRequest({
	req: req as IncomingMessage,
	headers: headers as Headers
});

auth.handleRequest({
	req: req as IncomingMessage,
	response: response as Response
});

auth.handleRequest({
	cookies: cookies as Cookies,
	request: request as Request
});

auth.handleRequest({
	request: request as Request
});
```

| name  | type                                                                            | optional |
| ----- | ------------------------------------------------------------------------------- | :------: |
| `req` | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |          |
| `res` | [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpoutgoingmessage) |    ✓     |

| name      | type                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| `req`     | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |
| `headers` | [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers)           |

| name       | type                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| `req`      | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |
| `response` | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)         |

| name      | type                                                                     | optional |
| --------- | ------------------------------------------------------------------------ | :------: |
| `cookies` | [`Cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies) |          |
| `request` | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)    |    ✓     |

| name      | type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `request` | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) |

## `node()`

Middleware for Node.js.

```ts
const node = () => Middleware;
```

#### Usage

```ts
import { node } from "lucia-auth/middleware";

const auth = lucia({
	middleware: node()
	// ...
});
```

```ts
auth.handleRequest(request as IncomingMessage, response as OutgoingMessage);
```

| name       | type                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| `request`  | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |
| `response` | [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpoutgoingmessage) |

## `h3()`

Middleware for H3 (Nuxt 3).

```ts
const h3: () => Middleware;
```

#### Usage

```ts
import { h3 } from "lucia-auth/middleware";

const auth = lucia({
	middleware: h3()
	// ...
});
```

```ts
auth.handleRequest(event as H3Event);
```

| name    | type                                                  |
| ------- | ----------------------------------------------------- |
| `event` | [`H3Event`](https://www.jsdocs.io/package/h3#H3Event) |

## `sveltekit()`

Middleware for SvelteKit 1.x.

```ts
const sveltekit: () => Middleware;
```

#### Usage

```ts
import { sveltekit } from "lucia-auth/middleware";

const auth = lucia({
	middleware: sveltekit()
	// ...
});
```

```ts
auth.handleRequest(event as RequestEvent);
```

| name    | type                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| `event` | [`RequestEvent`](https://kit.svelte.dev/docs/types#public-types-requestevent) |

## `web()`

Middleware for web standard request/response. Requires the framework/provider to support multiple `Set-Cookie` header value.

```ts
const web: () => Middleware;
```

#### Usage

```ts
import { web } from "lucia-auth/middleware";

const auth = lucia({
	middleware: web()
	// ...
});
```

```ts
auth.handleRequest(request as Request, response as Response);
auth.handleRequest(request as Request, headers as Headers);
```

| name      | type                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request` | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)                                                                            |
| `headers` | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)`\|`[`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) |

## `qwik()`

Middleware for Qwik City.

```ts
const qwik: () => Middleware;
```

#### Usage

```ts
import { qwik } from "lucia-auth/middleware";

const auth = lucia({
	middleware: qwik()
	// ...
});
```

```ts
auth.handleRequest(requestEvent as RequestEventLoader);
auth.handleRequest(requestEvent as RequestEventAction);
```

| name           | type                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestEvent` | [`RequestEventLoader`](https://qwik.builder.io/docs/route-loader/#requestevent)`\|`[`RequestEventAction`](https://qwik.builder.io/docs/action/#http-request-and-response) |
