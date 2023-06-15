---
order: 5
title: "Using cookies"
description: "Learn about how to use session cookies with Lucia"
---

Reading session cookies, validating them, and setting new ones are a bit tedious.

### CSRF protection

If you're working with cookies, **CSRF protection must be implemented** to prevent cross site request forgery (CSRF). Some Lucia methods includes CSRF protection by checking if the incoming request comes from a trusted origin, which includes the origin where the server is hosted on and origins defined in [`requestOrigins`]() configuration. CSRF checks are only done on POST and other non-GET method requests. **GET requests are not protected by Lucia and they should not modify server state (e.g. update password and profile) without additional protections.**

You can disable CSRF protection via [`csrfProtection`]() configuration.

## Validate session cookies

[`AuthRequest.validateRequest()`]() validates the request origin and the session cookie stored, renewing sessions if they're idle. It returns a valid session, or `null` if the session cookie is invalid or if the request is from an untrusted request origin.

```ts
const authRequest = auth.handleRequest();

const session = await authRequest.validate();
if (session) {
	// valid request
}
```

### Read session cookie

Alternatively, you can use [`Auth.readSessionCookie()`]() to read the session cookie. It takes a [`LuciaRequest`]() and returns the session cookie value if it exists or `null` if it doesn't. This _does not_ validate the session, nor does it validate the request origin. As such, [using `Auth.validateRequestOrigin()`]() is recommended.

```ts
auth.validateRequestOrigin(luciaRequest); // csrf protection
const sessionId = auth.readSessionCookie(luciaRequest);
if (sessionId) {
	const session = await auth.validateSession(sessionId); // note: `validateSession()` throws an error if session is invalid
}
```

## Set session cookies

You can set session cookies by passing `Session` to [`AuthRequest.]

```ts
authRequest.setSession(session);
authRequest.setSession(null); // delete session cookie
```

### Create session cookie

You can create a new [`Cookie`]() with [`Auth.createSessionCookie()`](), which takes in a `Session`. `Cookie.serialize()` can be used to generate a new `Set-Cookie` response headers value. You can also access the cookie name, value, and attributes (such a `httpOnly` and `maxAge`).

```ts
const sessionCookie = auth.createSessionCookie(session);

setResponseHeaders("Set-Cookie", sessionCookie.serialize());
// alternatively
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```

You can pass `null` to create an empty session cookie that when set, will delete the current session cookie.

```ts
const sessionCookie = auth.createSessionCookie(null);
setResponseHeaders("Set-Cookie", sessionCookie.serialize());
```

## Validate bearer tokens

```ts
const authRequest = auth.handleRequest();

const session = await authRequest.validateBearerToken();
if (session) {
	// valid request
}
```

## Read bearer token

```ts
const sessionId = auth.readBearerToken(luciaRequest);
if (sessionId) {
	// `validateSession()` throws an error if session is invalid
	// we're using `getSession()` here since it won't renew idle sessions
	const session = await auth.getSession(sessionId);
	if (session.state === "active") {
		// valid session
	} else {
		// idle session
		// prompt client to renew session
	}
}
```

## Validate request origin

```ts
try {
	await;
} catch {
	// invalid request origin
}
```
