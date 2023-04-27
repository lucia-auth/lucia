---
_order: 1
title: "`/middleware`"
---

These are exported from `lucia-auth/middleware`.

```ts
import { lucia } from "lucia-auth/middleware";
```

## `astro()`

Middleware for Astro 1.x and 2.x.

```ts
const astro = () => Middleware;
```

#### Usage

```ts
auth.handleRequest(context as APIContext);
```

| name    | type                                                                                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| context | [`APIContext`](https://docs.astro.build/en/reference/api-reference/#endpoint-context)`\|`[`Astro`](https://docs.astro.build/en/reference/api-reference/#astro-global) |

```ts
import { astro } from "lucia-auth/middleware";

const auth = lucia({
	adapter: astro()
	// ...
});
```

#### Example

```astro
---
import { auth } from "../lucia.js";

const authRequest = auth.handleRequest(Astro);
---
```

## `express()`

Middleware for Express 4.x and 5.x.

```ts
const express = () => Middleware;
```

#### Usage

```ts
import { express } from "lucia-auth/middleware";

const auth = lucia({
	adapter: express()
	// ...
});
```

```ts
auth.handleRequest(request as Request, response as Response);
```

| name     | type                                                   |
| -------- | ------------------------------------------------------ |
| request  | [`Request`](https://expressjs.com/en/4x/api.html#req)  |
| response | [`Response`](https://expressjs.com/en/4x/api.html#res) |

#### Example

```ts
import express from "express";
import { auth } from "./lucia.js";

const app = express();

app.use((req, res, next) => {
	res.locals.auth = auth.handleRequest(req, res);
	next();
});
```

## `lucia()`

The default middleware.

```ts
const lucia = () => Middleware;
```

#### Usage

```ts
import { lucia } from "lucia-auth/middleware";

const auth = lucia({
	adapter: lucia()
	// ...
});
```

```ts
auth.handleRequest(requestContext as RequestContext);
```

| name           | type                                                           |
| -------------- | -------------------------------------------------------------- |
| requestContext | [`RequestContext`](/reference/lucia-auth/types#requestcontext) |

## `node()`

Middleware for Node.js, can be used for Next.js as well.

```ts
const node = () => Middleware;
```

#### Usage

```ts
import { node } from "lucia-auth/middleware";

const auth = lucia({
	adapter: node()
	// ...
});
```

```ts
auth.handleRequest(request as IncomingMessage, response as OutgoingMessage);
```

| name     | type                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| request  | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |
| response | [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpoutgoingmessage) |

## `sveltekit()`

Middleware for SvelteKit 1.x.

```ts
const sveltekit = () => Middleware;
```

#### Usage

```ts
import { sveltekit } from "lucia-auth/middleware";

const auth = lucia({
	adapter: sveltekit()
	// ...
});
```

```ts
auth.handleRequest(event as RequestEvent);
```

| name  | type                                                                          |
| ----- | ----------------------------------------------------------------------------- |
| event | [`RequestEvent`](https://kit.svelte.dev/docs/types#public-types-requestevent) |

## `web()`

Middleware for web standard request/response. Requires the framework/provider to support multiple `Set-Cookie` header value.

```ts
const web = () => Middleware;
```

#### Usage

```ts
import { web } from "lucia-auth/middleware";

const auth = lucia({
	adapter: web()
	// ...
});
```

```ts
auth.handleRequest(request as Request, response as Response);
```

| name    | type                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------- |
| request | [`Request`](https://www.google.com/search?client=safari&rls=en&q=mdn+request&ie=UTF-8&oe=UTF-8) |
| headers | [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers)                           |

#### Example

```ts
import { auth } from "./lucia.js";

const request = new Request();
const headers = new Headers();
const authRequest = auth.handleRequest(request, headers);
// ...
const response = new Response(null, {
	headers
});
return response;
```
