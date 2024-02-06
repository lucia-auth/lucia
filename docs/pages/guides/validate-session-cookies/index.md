---
title: "Validate session cookies"
---

# Validate session cookies

This guide is also available for:

-   [Astro](/guides/validate-session-cookies/astro)
-   [Elysia](/guides/validate-session-cookies/elysia)
-   [Express](/guides/validate-session-cookies/express)
-   [Hono](/guides/validate-session-cookies/hono)
-   [Next.js App router](/guides/validate-session-cookies/nextjs-app)
-   [Next.js Pages router](/guides/validate-session-cookies/nextjs-pages)
-   [Nuxt](/guides/validate-session-cookies/nuxt)
-   [SolidStart](/guides/validate-session-cookies/solidstart)
-   [SvelteKit](/guides/validate-session-cookies/sveltekit)

**CSRF protection must be implemented when using cookies and forms.** This can be easily done by comparing the `Origin` and `Host` header.

For non-GET requests, check the request origin. You can use `readSessionCookie()` to get the session cookie from a HTTP `Cookie` header, and validate it with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
import { verifyRequestOrigin } from "lucia";

// Only required in non-GET requests (POST, PUT, DELETE, PATCH, etc)
const originHeader = request.headers.get("Origin");
// NOTE: You may need to use `X-Forwarded-Host` instead
const hostHeader = request.headers.get("Host");
if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
	return new Response(null, {
		status: 403
	});
}

const cookieHeader = request.headers.get("Cookie");
const sessionId = lucia.readSessionCookie(cookieHeader ?? "");
if (!sessionId) {
	return new Response(null, {
		status: 401
	});
}

const headers = new Headers();

const { session, user } = await lucia.validateSession(sessionId);
if (!session) {
	const sessionCookie = lucia.createBlankSessionCookie();
	headers.append("Set-Cookie", sessionCookie.serialize());
}

if (session && session.fresh) {
	const sessionCookie = lucia.createSessionCookie(session.id);
	headers.append("Set-Cookie", sessionCookie.serialize());
}
```

If your framework provides utilities for cookies, you can get the session cookie name with `Lucia.sessionCookieName`.

```ts
const sessionId = getCookie(lucia.sessionCookieName);
```

When setting cookies you can get the cookies name, value, and attributes from the `Cookie` object.

```ts
const sessionCookie = lucia.createSessionCookie(sessionId);
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```
