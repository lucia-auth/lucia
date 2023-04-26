---
title: "SvelteKit"
description: "Learn how to handle requests with Lucia using the SvelteKit middleware"
---

Middleware for SvelteKit 1.x.

```ts
const handleRequest: (event: RequestEvent) => AuthRequest;
```

| name  | type                                                                          |
| ----- | ----------------------------------------------------------------------------- |
| event | [`RequestEvent`](https://kit.svelte.dev/docs/types#public-types-requestevent) |

## Usage

```ts
import { sveltekit } from "lucia-auth/middleware";

const auth = lucia({
	adapter: sveltekit()
	// ...
});
```
