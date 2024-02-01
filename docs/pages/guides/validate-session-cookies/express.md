---
title: "Validate session cookies in Express"
---

# Validate session cookies in Express

**CSRF protection must be implemented when using cookies and forms.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating 2 middleware for CSRF protection and validating requests. You can get the cookie with `Lucia.readSessionCookie()` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { lucia } from "./auth.js";
import { verifyRequestOrigin } from "lucia";

import type { User } from "lucia";

app.use((req, res, next) => {
	if (req.method === "GET") {
		return next();
	}
	const originHeader = req.headers.origin ?? null;
	// NOTE: You may need to use `X-Forwarded-Host` instead
	const hostHeader = req.headers.host ?? null;
	if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
		return res.status(403).end();
	}
});

app.use((req, res, next) => {
	const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
	if (!sessionId) {
		res.locals.user = null;
		res.locals.session = null;
		return next();
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
	}
	if (!session) {
		res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	res.locals.user = user;
	res.locals.session = session;
	return next();
});

declare global {
	namespace Express {
		interface Locals {
			user: User | null;
			session: Session | null;
		}
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
