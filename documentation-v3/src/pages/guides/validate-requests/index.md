---
layout: "@layouts/DocLayout.astro"
title: "Validate requests"
---

This guide is also available for:

- [Astro](/guides/validate-requests/astro)
- [Elysia](/guides/validate-requests/elysia)
- [Express](/guides/validate-requests/express)
- [Hono](/guides/validate-requests/hono)
- [Next.js App router](/guides/validate-requests/nextjs-app)
- [Next.js Pages router](/guides/validate-requests/nextjs-pages)
- [Nuxt](/guides/validate-requests/nuxt)
- [SvelteKit](/guides/validate-requests/sveltekit)

We recommend using session cookies for most applications. **CSRF protection must be implemented when using cookies.** This can be easily done by comparing the `Origin` and `Host` header.

```ts
import { verifyRequestOrigin } from "oslo/request";

function validateRequestOrigin(request: Request): boolean {
	const originHeader = request.headers.get("Origin");
	const hostHeader = request.headers.get("Host");
	if (!originHeader || !hostHeader) {
		return false;
	}
	return verifyRequestOrigin(originHeader, [hostHeader]);
}
```

For non-GET requests, check the request origin. You can use `readSessionCookie()` to get the session cookie from a HTTP `Cookie` header, and validate it with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// only required in non-GET requests (POST, PUT, DELETE, PATCH, etc)
const validRequestOrigin = validateRequestOrigin(request);
if (!validRequestOrigin) {
	return new Response(null, {
		status: 403
	});
}

const cookieHeader = request.headers.get("Cookie");
if (cookieHeader) {
	return new Response(null, {
		status: 401
	});
}
const sessionId = lucia.readSessionCookie(cookieHeader);
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

When setting cookies you can get the cookies name, value, and attributes from the `SessionCookie` object.

```ts
const sessionCookie = lucia.createSessionCookie(sessionId);
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```