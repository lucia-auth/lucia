---
_order: 2
title: "Sessions"
---

Sessions are how you validate and keep track of users. You create new sessions for a user and store the id of the session to the user's browser or device. Session ids can then be used to validate the user.

### Session states

One important thing about sessions is their state. Sessions can be one of three states:

- Active: A valid session. Goes "idle" after some time.
- Idle: Still a valid session but must be renewed by Lucia. Goes "dead" after some time.
- Dead: An invalid session. The user must sign in again.

This allows active users to stay logged in, while invalidating inactive users.

## Create new session

The [`createSession()`](/reference/api/auth#createsession) method can be used to create new sessions for the user using the user's id.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.createSession(userId);
} catch {
	// invalid user id
}
```

### Create session cookie

The recommended way to store sessions is by using cookies. You can generate cookies represented with [`Cookie`](/reference/api/types#cookie) using [`createSessionCookies()`](/reference/api/auth#createsessioncookies) and serialize them with the `serialize()` method.

```ts
const session = await auth.createSession(userId);
const sessionCookies = auth.createSessionCookies(session); // Cookie[]
const serializedCookies = sessionCookies.map((cookie) => cookie.serialize());
setResponseHeaders("set-cookie", serializedCookies.toString());
```

## Validate session ids

The [`validateSession()`](/reference/api/auth#validatesession) method will validate the session id and return the session object, renewing the session if needed. As such, the returned session may not match the provided session id and should be stored. You can check if the returned session is a new session with the `isFresh` property.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateSession(sessionId);
	if (session.isFresh) {
		// session was renewed
		storeSessionCookie(session);
	}
} catch (e) {
	// invalid session id
}
```

It's common to need the user object on authorization, in which case you can use [`validateSessionUser()`](/reference/api/auth#validatesessionuser) to get both the user and session in a single database call.

```ts
import { auth } from "./lucia.js";

try {
	const { session, user } = await auth.validateSessionUser(sessionId);
	if (session.isFresh) {
		// session was renewed
		storeSessionCookie(session);
	}
} catch (e) {
	// invalid session id
}
```

### Getting the session from requests

The recommended way to read the session id is by using [`validateRequestHeaders()`](/reference/api/auth#validaterequestheaders). It takes the standard `Request` object, checks for CSRF using the `Origin` header, and returns the session id stored in the cookie. This does not validate the session itself.

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

### Get session

You can get non-dead sessions using [`getSession()`](/reference/api/auth#getsession). This does not renew idle sessions and returns both active and idle sessions.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.getSession(sessionId);
	if (session.state === "idle") {
		// renew session
	}
} catch {
	// invalid session
}
```

## Invalidate sessions

Sessions can be invalidated using [`invalidateSession()`](/reference/api/auth#invalidatesession).

> (red) **The session must be invalidated on sign out.** Depending on the application, you may want to invalidate all sessions belonging to the user on sign out. Make sure to invalidate all sessions of the user on password or privilege level change.

```ts
import { auth } from "./lucia.js";

await auth.invalidateSession(sessionId);
```

### Invalidate all user sessions

You can invalidate all sessions belonging to a user with [`invalidateAllUserSessions()`](/reference/api/auth#invalidateallusersessions).

```ts
import { auth } from "./lucia.js";

await auth.invalidateAllUserSessions(userId);
```

## Manually renew sessions

You can renew idle sessions with [`renewSession()`](/reference/api/auth#renewsession). Renewing sessions is not required if they're validated by using [`validateSession()`](/reference/api/auth#validatesession).

```ts
import { auth } from "./lucia.js";

try {
	const renewedSession = await auth.renewSession(sessionId);
} catch {
	// invalid refresh token
}
```

## Delete dead sessions

Your database may be polluted with expired, dead sessions. Lucia will attempt to clean up your database on some method call with the default configuration, but you can manually delete all dead sessions of a user with [`deleteDeadUserSessions()`](/reference/api/auth#deletedeadusersessions). You can disable the auto-database cleanup with the [`autoDatabaseCleanup`](/reference/api/configuration#autodatabasecleanup) configuration.

## Configure sessions

### Configure timeout

You can configure the active and idle period with [`sessionTimeout`](/reference/api/configuration#sessiontimeout).
