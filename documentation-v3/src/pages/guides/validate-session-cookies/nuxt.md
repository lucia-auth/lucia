---
layout: "@layouts/DocLayout.astro"
title: "Validate session cookies in Nuxt"
---

**CSRF protection must be implemented when using cookies.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `context`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// server/middleware/auth.ts
import { verifyRequestOrigin } from "oslo/request";

import type { H3Event } from "h3";
import type { User } from "lucia";

export default defineEventHandler((event) => {
	// CSRF protection
	// this is VERY important
	// you may want to skip the check for HEAD and OPTIONS requests too
	if (context.request.method !== "GET") {
		const originHeader = getHeader(event, "Origin") ?? null;
		const hostHeader = getHeader(event, "Host") ?? null;
		if (!originHeader || !hostHeader) {
			return event.node.res.writeHead(403).end();
		}
		const validRequestOrigin = verifyRequestOrigin(originHeader, [hostHeader]);
		if (!validRequestOrigin) {
			return event.node.res.writeHead(403).end();
		}
	}

	const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;
	if (!sessionId) {
		event.context.user = null;
		return;
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// update session expiration
		const sessionCookie = lucia.createSessionCookie(session.id);
		setCookie(event, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	if (!session) {
		// delete session cookie if invalid
		const sessionCookie = lucia.createBlankSessionCookie();
		setCookie(event, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	event.context.user = user;
});

declare module "h3" {
	interface H3EventContext {
		user: User | null;
	}
}
```

This will allow you to access the current user inside API routes.

```ts
export default defineEventHandler(async (event) => {
	if (!event.context.user) {
		throw createError({
			statusCode: 401
		});
	}
	// ...
});
```
