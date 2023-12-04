---
layout: "@layouts/DocLayout.astro"
title: "Validate session cookies in Express"
---



**CSRF protection must be implemented when using cookies.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `Response.locals`. You can get the cookie with `Lucia.readSessionCookie()` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { lucia } from "./auth.js";
import { verifyRequestOrigin } from "oslo/request";

import type { User } from "lucia";

app.use((req, res, next) => {
	if (req.method !== "GET") {
		const originHeader = req.headers.origin;
		const hostHeader = req.headers.host;
		if (!originHeader || !hostHeader) {
			return res.status(403).end();
		}
		const validRequestOrigin = verifyRequestOrigin(originHeader, [hostHeader]);
		if (!validRequestOrigin) {
			return c.res.status(403).end();
		}
	}

	const cookieHeader = req.headers.cookie;
	if (!cookieHeader) {
		res.locals.user = null;
		return next();
	}
	const sessionId = lucia.readSessionCookie(req.headers.cookie);
	if (!sessionId) {
		res.locals.user = null;
		return next();
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// update session expiration
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
	}
	if (!session) {
		// delete session cookie if invalid
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
