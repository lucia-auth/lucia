---
order: 5
title: "Using cookies"
description: "Learn about how to use session cookies with Lucia"
---

Cookies is the preferred way of storing and sending session ids when the frontend and backend is hosted on the same domain.

Some methods shown in this page is included in [`AuthRequest`](), which is explained in [Handle requests]() page.

### Security

If you're working with cookies, **CSRF protection must be implemented** to prevent [cross site request forgery (CSRF)]().

## Validate session cookies

[`AuthRequest.validateRequest()`]() validates the request origin and the session cookie stored, renewing sessions if they're idle. It returns a valid session, or `null` if the session cookie is invalid or if the request is from an untrusted request origin.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
if (session) {
	// valid request
}
```

CSRF protection is implemented by [using `Auth.validateRequestOrigin()`](). You can disable this with [`csrfProtection`]() configuration.

### Read session cookie

Alternatively, you can use [`Auth.readSessionCookie()`]() to read the session cookie. It takes a [`LuciaRequest`]() and returns the session cookie value if it exists or `null` if it doesn't. This _does not_ validate the session, nor does it validate the request origin. As such, [using `Auth.validateRequestOrigin()`]() is recommended.

```ts
import { auth } from "./lucia.js";

auth.validateRequestOrigin(luciaRequest); // csrf protection
const sessionId = auth.readSessionCookie(luciaRequest);
if (sessionId) {
	const session = await auth.validateSession(sessionId); // note: `validateSession()` throws an error if session is invalid
}
```

## Set session cookies

You can set session cookies by passing `Session` to [`AuthRequest.setSession()`](). You can pass `null` to

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
authRequest.setSession(session);
authRequest.setSession(null); // delete session cookie
```

### Create session cookies

You can create a new [`Cookie`]() with [`Auth.createSessionCookie()`](), which takes in a `Session`. `Cookie.serialize()` can be used to generate a new `Set-Cookie` response headers value. You can also access the cookie name, value, and attributes (such a `httpOnly` and `maxAge`).

```ts
import { auth } from "./lucia.js";

const sessionCookie = auth.createSessionCookie(session);

setResponseHeaders("Set-Cookie", sessionCookie.serialize());
// alternatively
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```

You can pass `null` to create an empty session cookie that when set, will delete the current session cookie.

```ts
import { auth } from "./lucia.js";

const sessionCookie = auth.createSessionCookie(null);
setResponseHeaders("Set-Cookie", sessionCookie.serialize());
```

## Validate request origin

[`Auth.validateRequestOrigin()`]() prevents CSRF by checking if the source of the request is from a trusted host (origin) by comparing the request url and the origin header. Trusted origins include where the API is hosted and origins defined in [`requestOrigins`]() configuration. This check is only done on POST and other non-GET method requests. **GET requests are not protected by Lucia and they should not modify server state (e.g. update password and profile) without additional protections.**

```ts
import { auth } from "./lucia.js";

try {
	auth.validateRequestOrigin({
		url: "http://localhost:3000", // request url
		headers: {
			origin: "http://localhost:3000" // 'Origin' header
		},
		method: "POST" // can be lowercase
	});
} catch {
	// invalid request origin
}
```
