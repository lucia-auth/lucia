---
_order: 2
title: "Sessions"
description: "Learn about sessions in Lucia"
---

Sessions are how you validate and keep track of users. You create new sessions for a user and store the id of the session to the user's browser or device. Session ids can then be used to validate the user.

### Session states

One important thing about sessions is their state. Sessions can be one of three states:

- Active: A valid session. Goes "idle" after some time.
- Idle: Still a valid session but must be renewed by Lucia. Goes "dead" after some time.
- Dead: An invalid session. The user must sign in again.

This allows active users to stay logged in, while invalidating inactive users.

## Create new session

The [`createSession()`](/reference/lucia-auth/auth#createsession) method can be used to create new sessions for the user using the user's id.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.createSession(userId);
} catch {
	// invalid user id
}
```

### Create session cookie

The recommended way to store sessions is by using cookies. You can generate cookies represented with [`Cookie`](/reference/lucia-auth/types#cookie) using [`createSessionCookie()`](/reference/lucia-auth/auth#createsessioncookie) and serialize them with the `serialize()` method.

```ts
const session = await auth.createSession(userId);
const sessionCookie = auth.createSessionCookie(session).serialize();
setResponseHeaders("Set-Cookie", sessionCookie);
```

We recommend [using `handleRequest()` for setting sessions](/basics/handle-requests#set-session-cookie) instead however.

## Validate session ids

The [`validateSession()`](/reference/lucia-auth/auth#validatesession) method will validate the session id and return the session object, renewing the session if needed. As such, the returned session may not match the provided session. You can check if the returned session is a new session with the `fresh` property.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateSession(sessionId);
	if (session.fresh) {
		// session was renewed
		storeSessionCookie(session);
	}
} catch (e) {
	// invalid session id
}
```

It's common to need the user object on authorization, in which case you can use [`validateSessionUser()`](/reference/lucia-auth/auth#validatesessionuser) to get both the user and session in a single database call.

```ts
import { auth } from "./lucia.js";

try {
	const { session, user } = await auth.validateSessionUser(sessionId);
	if (session.fresh) {
		// session was renewed
		storeSessionCookie(session);
	}
} catch (e) {
	// invalid session id
}
```

We recommend [using `handleRequest()` for validating requests](/basics/handle-requests#validate-requests) instead however, as it'll extract the session id for you.

### Get session from requests

The recommended way to read the session id is by using [`parseRequestHeaders()`](/reference/lucia-auth/auth#parserequestheaders). It takes a [`LuciaRequest`](http://localhost:3000/reference/lucia-auth/types#luciarequest) object, checks for CSRF using the `Origin` header, and returns the session id stored in the cookie. This does not validate the session itself.

```ts
import { auth } from "./lucia.js";

try {
	const sessionId = auth.validateRequestHeaders(request);
	const session = await auth.validateSession(sessionId);
} catch {
	// invalid request
}
```

Alternatively, you can read the cookie directly. The cookie name is provided as a `SESSION_COOKIE_NAME` constant. Make sure to implement your own CSRF protection in this case.

```ts
import { SESSION_COOKIE_NAME } from "lucia-auth";
import { auth } from "./lucia.js";

const sessionId = getCookie(SESSION_COOKIE_NAME);
```

### Validate sessions without renewing them

You can validate if the session is not dead by using [`getSession()`](/reference/lucia-auth/auth#getsession). This does not renew idle sessions and returns both active and idle sessions. See [Manually renew sessions](/basics/sessions#manually-renew-sessions) to learn how to renew idle sessions manually.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.getSession(sessionId);
	if (session.state === "idle") {
		// renewal required
	}
} catch {
	// invalid session
}
```

## Invalidate sessions

Sessions can be invalidated using [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession).

> (red) **The session must be invalidated on sign out.** Depending on the application, you may want to invalidate all sessions belonging to the user on sign out. Make sure to invalidate all sessions of the user on password or privilege level change.

```ts
import { auth } from "./lucia.js";

await auth.invalidateSession(sessionId);
```

### Invalidate all user sessions

You can invalidate all sessions belonging to a user with [`invalidateAllUserSessions()`](/reference/lucia-auth/auth#invalidateallusersessions).

```ts
import { auth } from "./lucia.js";

await auth.invalidateAllUserSessions(userId);
```

## Manually renew sessions

You can renew idle sessions with [`renewSession()`](/reference/lucia-auth/auth#renewsession). Renewing sessions is not required if you're validated them using [`validateSession()`](/reference/lucia-auth/auth#validatesession).

```ts
import { auth } from "./lucia.js";

try {
	const renewedSession = await auth.renewSession(sessionId);
} catch {
	// invalid refresh token
}
```

## Delete dead sessions

Your database may be polluted with expired, dead sessions. Lucia will attempt to clean up your database on some method call with the default configuration, but you can manually delete all dead sessions of a user with [`deleteDeadUserSessions()`](/reference/lucia-auth/auth#deletedeadusersessions). You can disable the auto-database cleanup with the [`autoDatabaseCleanup`](/basics/configuration#autodatabasecleanup) configuration.

## Configure sessions

### Configure expiration

You can configure the active and idle period with [`sessionExpiresIn`](/basics/configuration#sessionexpiresin) configuration.
