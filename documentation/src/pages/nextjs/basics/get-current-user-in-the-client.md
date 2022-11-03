---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Get current user in the client"
---

While the most straightforward way to get the current user in the client is to pass on the user object from `getServerSideProps()`, you can use [`getUser()`]() exported by `@lucia-auth/nextjs/client` to get the user by calling a GET request.

```ts
import { getUser } from "@lucia-auth/nextjs/client";

const user = await getUser();
```
