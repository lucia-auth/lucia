---
title: "Using cookies"
description: "Learn how to use session cookies with Lucia"
---

Cookies is the preferred way of storing and sending session ids when the frontend and backend is hosted on the same domain.

Some methods shown in this page is included in [`AuthRequest`](/reference/lucia/interfaces/authrequest), which is described in [Handle requests](/basics/handle-requests) page.

### Security

If you're working with cookies, **CSRF protection must be implemented** to prevent [cross site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf).

Lucia offers built-in CSRF protection when validating session cookies by checking the `Origin` header. This means all requests that are not GET, OPTIONS, HEAD, or TRACE methods will be rejected by default if they're not a same-origin request (domain and subdomain must match). You can disable this feature or configure its behavior with the [`csrfProtection.allowedSubdomains`](/basics/configuration#csrfprotection) configuration.

**GET requests are not protected by Lucia and they should not modify server state (e.g. update password and profile) without additional protections.**

### Cookie expiration

By default, session cookies are set to expire when the session expires. This behavior may not be preferable if you cannot always set cookies after extending sessions expiration. You can set the session cookies to last indefinitely by setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) configuration to `false`. Enabling this will not change the session expiration, but rather only the cookie.

## Validate session cookies

[`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate) validates the request origin and the session cookie stored, resetting sessions if they're idle. It returns a valid session, or `null` if the session cookie is invalid or if the request is from an untrusted request origin.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
if (session) {
	// valid request
}
```

### Read session cookie

Alternatively, you can use [`Auth.readSessionCookie()`](/reference/lucia/interfaces/auth#readsessioncookie) to read the session cookie. It takes a [`LuciaRequest`](/reference/lucia/interfaces#luciarequest) and returns the session cookie value if it exists or `null` if it doesn't. This _does not_ validate the session, nor does it validate the request origin.

```ts
import { auth } from "./lucia.js";

const sessionId = auth.readSessionCookie(luciaRequest);
if (sessionId) {
	const session = await auth.validateSession(sessionId); // note: `validateSession()` throws an error if session is invalid
}
```

### Caching

`AuthRequest.validate()` caches the request, so it will only run once no matter how many times you call it. The cache is invalidated whenever `AuthRequest.setSession()` is called. This is useful when you have multiple pages/components the method can be called.

```ts
await authRequest.validate();
await authRequest.validate(); // uses cache from previous call
```

```ts
await Promise([
	authRequest.validate(),
	authRequest.validate() // waits for first call to resolve
]);
```

### Invalidation

After updating user attributes, for example, call [`AuthRequest.invalidate()`](/reference/lucia/interfaces/authrequest#invalidate) to invalidate internal cache so the next time you call `AuthRequest.validate()`, it returns the latest user data.

```ts
await auth.updateUserAttributes(userId, {
	username: newUsername
});
authRequest.invalidate();

// returns latest user data
const session = await authRequest.validate();
```

## Set session cookies

You can set session cookies by passing `Session` to [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). You can pass `null` to delete session cookies.

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
authRequest.setSession(session);
authRequest.setSession(null); // delete session cookie
```

This is disabled and will throw an error when using [`web()`](/reference/lucia/modules/middleware#web) and some configuration of [`nextjs_future()`](/reference/lucia/modules/middleware#nextjs) middleware. If you're using them, set session cookies manually as described below.

### Create session cookies

You can create a new [`Cookie`](/reference/lucia/interfaces#cookie) with [`Auth.createSessionCookie()`](/reference/lucia/interfaces/auth#createsessioncookie), which takes in a `Session`. `Cookie.serialize()` can be used to generate a new `Set-Cookie` response headers value. You can also access the cookie name, value, and attributes (such a `httpOnly` and `maxAge`).

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

## Using an external backend

If your backend is hosted on a different subdomain, requests to it will be considered cross-origin and CORS policies will apply. However you've set up your CORS policy, make sure to set the `credentials` option to `"include"` when making `fetch()` request to send _and_ receive cookies.

```ts
await fetch("https://api.example.com", {
	// ...
	credentials: "include"
});
```

We discourage hosting the backend on a separate domain since cookies the client receives will be considered "third party cookies," which are blocked by default in Safari.
