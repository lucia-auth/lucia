---
title: "Astro"
description: "Learn how to handle requests with Lucia using the Astro middleware"
---

Middleware for Astro 1.x and 2.x.

```ts
const handleRequest: (context: APIContext | Astro) => AuthRequest;
```

| name    | type                                                                                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| context | [`APIContext`](https://docs.astro.build/en/reference/api-reference/#endpoint-context)`\|`[`Astro`](https://docs.astro.build/en/reference/api-reference/#astro-global) |
