---
title: "Validate session cookies in SolidStart"
---

# Validate session cookies in SolidStart

**CSRF protection must be implemented when using cookies and forms.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `context`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { createMiddleware, appendHeader, getCookie, getHeader } from "@solidjs/start/server";
import { Session, User, verifyRequestOrigin } from "lucia";
import { lucia } from "./lib/auth";

export default defineEventHandler((event) => {
	if (context.request.method !== "GET") {
		const originHeader = getHeader(event, "Origin") ?? null;
		// NOTE: You may need to use `X-Forwarded-Host` instead
		const hostHeader = getHeader(event, "Host") ?? null;
		if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
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
		appendResponseHeader(
			event,
			"Set-Cookie",
			lucia.createSessionCookie(session.id).serialize()
		);
	}
	if (!session) {
		appendResponseHeader(event, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	event.context.user = user;
});

declare module "vinxi/server" {
	interface H3EventContext {
		user: User | null;
		session: Session | null;
	}
}
```

Make sure to declare the middleware module in the config.

```ts
// vite.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
	start: {
		middleware: "./src/middleware.ts"
	}
});
```

This will allow you to access the current user inside server contexts.

```ts
import { getRequestEvent } from "solid-js/web";

const user = getRequestEvent()!.context.user;
```
