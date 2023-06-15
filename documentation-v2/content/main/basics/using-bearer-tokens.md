---
order: 6
title: "Using bearer tokens"
description: "Learn about how to use bearer tokens with Lucia"
---

Sending session ids as bearer tokens is useful when your frontend and backend is hosted on a different domain, such as certain single page applications, mobile apps, and desktop apps. Bearer tokens are sent in the authorization header, prefixed with `Bearer`.

```http
Authorization: Bearer <session_id>
```

Some methods shown in this page is included in [`AuthRequest`](), which is described in [Handle requests]() page.

## Validate bearer tokens

You can use [`AuthRequest.validateBearerToken()`]() to validate the bearer token. It returns a session if the session is active, and `null` if the session is idle or dead.

```ts
const authRequest = auth.handleRequest();

const session = await authRequest.validateBearerToken();
if (session) {
	// valid request
}
```

You can alternatively validate the session id manually. [Use `Auth.getSession()`]() since we don't want to renew idle sessions and invalidate the session stored in the client (unlike cookies, the server can't update the session stored in the client).

```ts
try {
	const session = await auth.getSession(sessionId);
	if (session.state === "active") {
		// valid session
	} else {
		// idle session
		// prompt client to renew session
	}
} catch {
	// invalid session
}
```

### Read bearer tokens

You can get the session id from the authorization header using `Auth.readBearerToken()`, which returns a session id or `null` if the token does not exist. This _does not_ validate the session id.

```ts
const authorizationHeader = request.headers.get("Authorization");
const sessionId = auth.readBearerToken(authorizationHeader);
```

### Caching

`AuthRequest.validateBearerToken()` caches the request, so it will only run once no matter how many times you call it. This is useful when you have multiple pages/components the method can be called.

```ts
await authRequest.validateBearerToken();
await authRequest.validateBearerToken(); // uses first cache
```

```ts
await Promise([authRequest.validateBearerToken(), authRequest.validateBearerToken()]); // only runs once
```

## Renew bearer tokens

You can renew the bearer token using `AuthRequest.renewBearerToken()`, which returns a session if successful or `null` if the session is invalid.

```ts
const authRequest = auth.handleRequest();

const renewedSession = await authRequest.renewBearerToken();
```
