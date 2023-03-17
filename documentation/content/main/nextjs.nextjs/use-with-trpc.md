---
_order: 3
title: "Use with tRPC"
---

[tRPC](https://github.com/trpc/trpc) makes it easy to implement type-safe APIs in your Next.js application. Since [`AuthRequest()`](/nextjs/api-reference/server-api#authrequest) only requires Next.js `req` and `res`, it's super easy to add Lucia to tRPC.

```ts
// src/pages/api/[trpc].ts
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";
import { initTRPC } from "@trpc/server";
import { createNextApiHandler } from "@trpc/server/adapters/next";

import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

const createContext = (opts: CreateNextContextOptions) => {
	return {
		auth: new AuthRequest(auth, opts.req, opts.res)
	};
};

type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

const router = t.router({
	user: t.procedure.query(async ({ ctx }) => {
		const { user } = await ctx.auth.validateUser();
		return user;
	})
});

export default createNextApiHandler({
	router,
	createContext
});
```
