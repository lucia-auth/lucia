---
layout: "@layouts/DocLayout.astro"
title: "Validate requests in Astro"
---

We recommend using session cookies for most applications.

**CSRF protection must be implemented when using cookies.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `locals`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

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
		const originHeader = request.headers.get("Origin");
		const hostHeader = request.headers.get("Host");
		if (!originHeader || !hostHeader) {
			return new Response(null, {
				status: 403
			});
		}
		const validRequestOrigin = verifyRequestOrigin(originHeader, [hostHeader]);
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

This will allow you to access the current user inside `.astro` pages and API routes.

```ts
---
if (!Astro.locals.user) {
    return Astro.redirect("/login")
}
---
```

```ts
import { lucia } from "$lib/server/auth";

export function GET(context: APIContext): Promise<Response> {
	if (!context.locals.user) {
		return new Response(null, {
			status: 401
		});
	}
	// ...
}
```
