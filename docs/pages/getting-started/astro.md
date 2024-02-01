---
title: "Getting started in Astro"
---

# Getting started in Astro

## Installation

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia oslo
```

## Update Vite

If you've installed `oslo`, add `oslo` to `vite.optimizeDeps.exclude`.

```ts
// astro.config.mjs
export default defineConfig({
	// ...
	vite: {
		optimizeDeps: {
			exclude: ["oslo"]
		}
	}
});
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to set up your database and initialize the adapter. Make sure to configure the `sessionCookie` option and register your `Lucia` instance type

```ts
// src/auth.ts
import { Lucia } from "lucia";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: import.meta.env.PROD
		}
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Set up middleware

We recommend setting up a middleware to validate requests. The validated user will be available as `local.user`. You can just copy-paste the code into `src/middleware.ts`.

It's a bit verbose, but it just reads the session cookie, validates it, and sets a new cookie if necessary. Since Astro doesn't implement CSRF protection out of the box, it must be implemented. If you're curious about what's happening here, see the [Validating requests](/guides/validate-session-cookies/astro) page.

```ts
// src/middleware.ts
import { lucia } from "./auth";
import { verifyRequestOrigin } from "lucia";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.request.method !== "GET") {
		const originHeader = context.request.headers.get("Origin");
		const hostHeader = context.request.headers.get("Host");
		if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
			return new Response(null, {
				status: 403
			});
		}
	}

	const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
	if (!sessionId) {
		context.locals.user = null;
		context.locals.session = null;
		return next();
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	context.locals.session = session;
	context.locals.user = user;
	return next();
});
```

Make sure sure to type `App.Locals` as well.

```ts
// src/env.d.ts

/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		session: import("lucia").Session | null;
		user: import("lucia").User | null;
	}
}
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
