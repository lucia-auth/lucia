---
title: "Validate session cookies in Hono"
---

# Validate session cookies in Hono

**CSRF protection must be implemented when using cookies and forms.** This can be done using the `csrf()` middleware provided by Hono.

After csrf protection, we recommend adding a middleware for validating requests. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { lucia } from "./auth.js";
import { getCookie } from "hono/cookie";
import { csrf } from "hono/csrf";

import type { User, Session } from "lucia";

const app = new Hono<{
	Variables: {
		user: User | null;
		session: Session | null;
	};
}>();

// see https://hono.dev/middleware/builtin/csrf for more options
app.use(csrf());

app.use("*", async (c, next) => {
	const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
	if (!sessionId) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}
	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// use `header()` instead of `setCookie()` to avoid TS errors
		c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
			append: true
		});
	}
	if (!session) {
		c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
			append: true
		});
	}
	c.set("user", user);
	c.set("session", session);
	return next();
});
```

This will allow you to access the current user with `Context.get()`.

```ts
app.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.body(null, 401);
	}
	// ...
});
```
