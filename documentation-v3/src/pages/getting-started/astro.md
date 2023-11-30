---
layout: "@layouts/DocLayout.astro"
title: "Getting started in Astro"
---

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia@beta oslo
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to setup your database and initialize the adapter. Make sure you:

- Use the `astro` middleware
- Configure the `sessionCookie` option
- Register your `Lucia` instance type

```ts
// src/auth.ts
import { Lucia } from "lucia";
import { astro } from "lucia/middleware";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	middleware: astro(),
	sessionCookie: {
		// IMPORTANT!
		attributes: {
			// set to `true` when using HTTPS
			secure: import.meta.env.PROD
		}
	}
});

// IMPORTANT!
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Setup middleware

If you're planning to use cookies to store the session, we recommend setting up middleware to make `AuthRequest` available in all routes.

```ts
// src/middleware.ts
import { lucia } from "./lucia";

import type { MiddlewareResponseHandler } from "astro";

export const onRequest: MiddlewareResponseHandler = async (context, next) => {
	context.locals.lucia = lucia.handleRequest(context);
	return await next();
};
```

Make sure sure to type `App.Locals` as well.

```ts
// src/env.d.ts

/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		lucia: import("lucia").AuthRequest;
	}
}
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Starter guides](/starter-guides) page or the [examples repository](/https://github.com/lucia-auth/examples).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
