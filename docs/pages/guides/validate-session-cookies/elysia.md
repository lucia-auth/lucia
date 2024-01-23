---
title: "Validate session cookies in Elysia"
---

# Validate session cookies in Elysia

**CSRF protection must be implemented when using cookies and forms.** This can be easily done by comparing the `Origin` and `Host` header.

We recommend creating a middleware to validate requests and store the current user inside `Context` with `App.derive()`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/middleware.ts
import { verifyRequestOrigin } from "lucia";

import type { User, Session } from "lucia";

const app = new Elysia().derive(
	async (
		context
	): Promise<{
		user: User | null;
		session: Session | null;
	}> => {
		// CSRF check
		if (context.request.method !== "GET") {
			const originHeader = context.request.headers.get("Origin");
			// NOTE: You may need to use `X-Forwarded-Host` instead
			const hostHeader = context.request.headers.get("Host");
			if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
				return {
					user: null,
					session: null
				};
			}
		}

		// use headers instead of Cookie API to prevent type coercion
		const cookieHeader = context.request.headers.get("Cookie") ?? "";
		const sessionId = lucia.readSessionCookie(cookieHeader);
		if (!sessionId) {
			return {
				user: null,
				session: null
			};
		}

		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookie[sessionCookie.name].set({
				value: sessionCookie.value,
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			context.cookie[sessionCookie.name].set({
				value: sessionCookie.value,
				...sessionCookie.attributes
			});
		}
		return {
			user,
			session
		};
	}
);
```

This will allow you to access the current user with `Context.user`.

```ts
app.get("/", async (context) => {
	if (!context.user) {
		return new Response(null, {
			status: 401
		});
	}
	// ...
});
```
