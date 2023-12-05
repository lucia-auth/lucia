---
layout: "@layouts/DocLayout.astro"
title: "Validate session cookies in Express"
---

**CSRF protection must be implemented when using cookies.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating 2 middleware for CSRF protection and validating requests. You can get the cookie with `Lucia.readSessionCookie()` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { lucia } from "./auth.js";
import { verifyRequestOrigin } from "oslo/request";

import type { User } from "lucia";

app
	.use((req, res, next) => {
		if (req.method === "GET") {
			return next();
		}
		if (
			!req.headers.origin ||
			!req.headers.host ||
			!verifyRequestOrigin(req.headers.origin, [req.headers.host])
		) {
			return c.res.status(403).end();
		}
	})
	.use((req, res, next) => {
		const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
		if (!sessionId) {
			res.locals.user = null;
			return next();
		}

		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
		}
		if (!session) {
			res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
		}
		res.locals.user = user;
		return next();
	});
```

Create a `.d.ts` file inside your project to declare types for `Locals`.

```ts
// app.d.ts
declare namespace Express {
	interface Locals {
		user: import("lucia").User | null;
	}
}
```

This will allow you to access the current user with `res.locals`.

```ts
app.get("/", (req, res) => {
	if (!res.locals.user) {
		return res.status(403).end();
	}
	// ...
});
```
