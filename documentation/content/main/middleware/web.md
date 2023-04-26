---
title: "Web"
description: "Learn how to handle standard request/response using the web middleware"
---

Middleware for web standard request/response. Requires the framework/provider to support multiple `Set-Cookie` header value.

```ts
const handleRequest: (request: Request, headers: Headers) => AuthRequest;
```

| name    | type          |
| ------- | ------------- |
| request | [`Request`]() |
| headers | [`Headers`]() |

## Usage

```ts
import { web } from "lucia-auth/middleware";

const auth = lucia({
	adapter: web()
	// ...
});
```

## Example

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
