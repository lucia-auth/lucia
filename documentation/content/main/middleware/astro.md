---
title: "Astro"
description: "Learn how to handle requests with Lucia using the Astro middleware"
---

Middleware for Astro 1.x and 2.x.

```ts
const handleRequest: (context: APIContext) => AuthRequest;
```

| name    | type                                                                                  |
| ------- | ------------------------------------------------------------------------------------- |
| context | [`APIContext`](https://docs.astro.build/en/reference/api-reference/#endpoint-context) |

## Example

```ts
// index.astro
import { auth } from "../lib/lucia";

const authRequest = auth.handleRequest(Astro);
const session = await authRequest.validate();
```

```ts
// index.ts
export const get: APIRoute = async (context) => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
};
```
