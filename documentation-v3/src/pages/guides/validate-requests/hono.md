---
layout: "@layouts/DocLayout.astro"
title: "Validate requests in Hono"
---

We recommend using session cookies for most applications.

**CSRF protection must be implemented when using cookies.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `Context`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { lucia } from "./auth.js";
import { verifyRequestOrigin } from "oslo/request";
import { getCookie } from "hono/cookie";

import type { User } from "lucia";

const app = new Hono<{
	Variables: {
		user: User | null;
	};
}>();

app.use("*", (c, next) => {
	if (c.req.method !== "GET") {
		const originHeader = c.req.headers.get("Origin");
		const hostHeader = c.req.headers.get("Host");
		if (!originHeader || !hostHeader) {
			return c.body(null, 403);
		}
		const validRequestOrigin = verifyRequestOrigin(originHeader, [hostHeader]);
		if (!validRequestOrigin) {
			return c.body(null, 403);
		}
	}

	const sessionId = getCookie(lucia.sessionCookieName) ?? null;
	if (!sessionId) {
		c.set("user", null);
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// update session expiration
		// use `header()` instead of `setCookie()` to avoid TS errors
		c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
			append: true
		});
	}
	if (!session) {
		// delete session cookie if invalid
		c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
			append: true
		});
	}
	c.set("user", user);
	return next();
});
```

This will allow you to access the current user with `Context.get()`.

```ts
app.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.body(null, 401s);
	}
});
```
