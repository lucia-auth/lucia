---
layout: "@layouts/DocLayout.astro"
title: "Getting started in Sveltekit"
---

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia@beta oslo
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to setup your database and initialize the adapter. Make sure you:

- Use the `sveltekit` middleware
- Configure the `sessionCookie` option
- Register your `Lucia` instance type

```ts
// src/lib/server/auth.ts
import { Lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { prod } from "$app/environment";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	middleware: sveltekit(),
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
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
// src/hooks.server.ts
import { lucia } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// we can pass `event` because we used the SvelteKit middleware
	event.locals.lucia = lucia.handleRequest(event);
	return await resolve(event);
};
```

Make sure sure to type `App.Locals` as well.

```ts
// src/app.d.ts
declare global {
	namespace App {
		interface Locals {
			lucia: import("lucia").AuthRequest;
		}
	}
}
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](/https://github.com/lucia-auth/examples).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
