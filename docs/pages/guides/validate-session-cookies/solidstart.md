---
title: "Validate session cookies in SolidStart"
---

# Validate session cookies in SolidStart

**CSRF protection must be implemented when using cookies and forms.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `context`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { createMiddleware } from "@solidjs/start/middleware";
import { appendHeader, getCookie, getHeader } from "vinxi/http";
import { Session, User, verifyRequestOrigin } from "lucia";
import { lucia } from "./lib/auth";

export default createMiddleware({
	onRequest: async (event) => {
		const { nativeEvent } = event;
		if (event.request.method !== "GET") {
			const originHeader = getHeader(nativeEvent, "Origin") ?? null;
			// NOTE: You may need to use `X-Forwarded-Host` instead
			const hostHeader = getHeader(nativeEvent, "Host") ?? null;
			if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
				nativeEvent.node.res.writeHead(403).end();
				return;
			}
		}
		const sessionId = getCookie(nativeEvent, lucia.sessionCookieName) ?? null;
		if (!sessionId) {
			event.locals.session = null;
			event.locals.user = null;
			return;
		}

		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			appendHeader(
				nativeEvent,
				"Set-Cookie",
				lucia.createSessionCookie(session.id).serialize()
			);
		}
		if (!session) {
			appendHeader(nativeEvent, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
		}
		event.locals.session = session;
		event.locals.user = user;
	}
});

declare module "@solidjs/start/server" {
	interface RequestEventLocals {
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

const user = getRequestEvent()!.locals.user;
```
