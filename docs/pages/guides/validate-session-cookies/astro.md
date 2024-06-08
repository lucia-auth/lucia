---
title: "Validate session cookies in Astro"
---

# Validate session cookies in Astro

**CSRF protection must be implemented when using cookies and forms.** This can be easily done by updating your Astro config (available Astro 4.9+).

```ts
// astro.config.js
import { defineConfig } from "astro/config";

export default defineConfig({
	// ...
	security: {
		checkOrigin: true
	}
});
```

We recommend creating a middleware to validate requests and store the current user inside `locals`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { lucia } from "./auth";
import { verifyRequestOrigin } from "lucia";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
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
	context.locals.user = user;
	context.locals.user = session;
	return next();
});
```

Make sure to type `App.Locals` as well.

```ts
// src/env.d.ts

/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		user: import("lucia").User | null;
		session: import("lucia").Session | null;
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
