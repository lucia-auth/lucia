---
layout: "@layouts/DocLayout.astro"
title: "Getting started in Astro"
---

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia@beta oslo
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to setup your database and initialize the adapter. Make sure to configure the `sessionCookie` option and register your `Lucia` instance type

```ts
// src/auth.ts
import { Lucia } from "lucia";
import { prod } from "$app/environment";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Setup middleware

We recommend setting up a middleware to validate requests. The validated user will be available as `local.user`. You can just copy-paste the code into `src/middleware.ts`. 

It's a bit verbose, but it just reads the session cookie, validates it, and sets a new cookie if necessary. Since Astro doesn't implement CSRF protection out of the box, it must be implemented. If you're curious about what's happening here, see the [Validating requests](/basics/validate-session-cookies/astro) page.

```ts
// src/middleware.ts
import { lucia } from "./auth";
import { verifyRequestOrigin } from "oslo/request";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	// CSRF protection
	// this is VERY important
	// you may want to skip the check for HEAD and OPTIONS requests too
	if (context.request.method !== "GET") {
		const validRequestOrigin = validateRequestOrigin(context.request);
		if (!validRequestOrigin) {
			return new Response(null, {
				status: 403
			});
		}
	}
	const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
	if (!sessionId) {
		context.locals.user = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// update session expiration
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	if (!session) {
		// delete session cookie if invalid
		const sessionCookie = lucia.createBlankSessionCookie();
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	context.locals.user = user;
	return resolve(event);
});

function validateRequestOrigin(request: Request): boolean {
	const originHeader = request.headers.get("Origin");
	const hostHeader = request.headers.get("Header");
	if (!originHeader || !hostHeader) {
		return false;
	}
	// check if the hostname matches
	// to allow more domains, add them into the array
	return verifyRequestOrigin(originHeader, [hostHeader]);
}
```

Make sure sure to type `App.Locals` as well.

```ts
// src/env.d.ts

/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		user: import("lucia").User;
	}
}
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](/https://github.com/lucia-auth/examples).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
