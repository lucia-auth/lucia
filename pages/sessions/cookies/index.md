---
title: "Session cookies"
---

# Session cookies

_This page builds upon the API defined in the [Basic session API](/sessions/basic-api) page._

Framework and library specific guides are also available:

- [Astro](/sessions/cookies/astro)
- [Next.js](/sessions/cookies/nextjs)
- [Nuxt](/sessions/cookies/nuxt)
- [SvelteKit](/sessions/cookies/sveltekit)

## CSRF protection

CSRF protection is a must when using cookies. A very simple way to prevent CSRF attacks is to check the `Origin` header for non-GET requests. If you rely on this method, it is crucial that your application does not use GET requests for modifying resources.

```ts
// `HTTPRequest` and `HTTPResponse` are generic interfaces.
// Adjust this code to fit your framework's API.

function handleRequest(request: HTTPRequest, response: HTTPResponse): void {
	if (request.method !== "GET") {
		const origin = request.headers.get("Origin");
		// You can also compare it against the Host or X-Forwarded-Host header.
		if (origin === null || origin !== "https://example.com") {
			response.setStatusCode(403);
			return;
		}
	}

	// ...
}
```

## Cookies

If the frontend and backend are hosted on the same domain, session cookies should have the following attributes:

- `HttpOnly`: Cookies are only accessible server-side
- `SameSite=Lax`: Use `Strict` for critical websites
- `Secure`: Cookies can only be sent over HTTPS (Should be omitted when testing on localhost)
- `Max-Age` or `Expires`: Must be defined to persist cookies
- `Path=/`: Cookies can be accessed from all routes

> Lucia v3 used `auth_session` as the session cookie name.

```ts
// `HTTPResponse` is a generic interface.
// Adjust this code to fit your framework's API.

export function setSessionTokenCookie(response: HTTPResponse, token: string, expiresAt): void {
	if (env === Env.PROD) {
		// When deployed over HTTPS
		response.headers.add(
			"Set-Cookie",
			`session=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/; Secure;`
		);
	} else {
		// When deployed over HTTP (localhost)
		response.headers.add(
			"Set-Cookie",
			`session=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/`
		);
	}
}

export function deleteSessionTokenCookie(response: HTTPResponse): void {
	if (env === Env.PROD) {
		// When deployed over HTTPS
		response.headers.add("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Secure;");
	} else {
		// When deployed over HTTP (localhost)
		response.headers.add("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/");
	}
}
```

## Session validation

Sessions can be validated by getting the cookie and using the `validateSession()` function we created. If the session is invalid, delete the session cookie. Importantly, we recommend setting a new session cookie after validation to persist the cookie for an extended time.

```ts
import { validateSessionToken, deleteSessionTokenCookie, setSessionTokenCookie } from "./auth.js";

// `HTTPRequest` and `HTTPResponse` are generic interfaces.
// Adjust this code to fit your framework's API.

function handleRequest(request: HTTPRequest, response: HTTPResponse): void {
	// csrf protection
	if (request.method !== "GET") {
		const origin = request.headers.get("Origin");
		// You can also compare it against the Host or X-Forwarded-Host header.
		if (origin === null || origin !== "https://example.com") {
			response.setStatusCode(403);
			return;
		}
	}

	// session validation
	const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
	const token = cookies.get("session");
	if (sessionId === null) {
		response.setStatusCode(401);
		return;
	}

	const { session, user } = await validateSessionToken(token);
	if (session === null) {
		deleteSessionTokenCookie(response);
		response.setStatusCode(401);
		return;
	}
	setSessionTokenCookie(response, token, session, expiresAt);

	// ...
}
```
