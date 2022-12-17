---
order: 4
title: "Validate sessions"
---

## Get session ids

### From requests

[`validateRequestHeaders()`](/reference/api/server-api#validaterequestheaders) takes in the standard fetch request, check for CSRF, and return the value of the session cookie. CSRF is only checked if [`csrfProtection`](/reference/configure/lucia-configurations#csrfprotection) is enabled (enabled by default).

```ts
import { auth } from "./lucia.js";

try {
	const sessionId = auth.validateRequestHeaders(request);
} catch {
	// invalid request
}
```

### From cookies

[`SESSION_COOKIE_NAME`](/reference/api/server-api#session_cookie_name-constant) can be imported and be used to get the session cookie. To prevent CSRF attacks however, we recommend using `validateRequestHeaders()` alongside.

```ts
import { SESSION_COOKIE_NAME } from "lucia-auth";
import { auth } from "./lucia.js";

try {
	auth.validateRequestHeaders(request); // check for CSRF
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
} catch {
	// invalid request
}
```

## Validate session ids

### Get the session

[`validateSession()`](/reference/api/server-api#validatesession) will validate the session id and return the session, renewing the session if needed. As such, the returned session may not match the provided session id and should be stored as a cookie again if needed.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateSession(sessionId);
	if (session.isFresh) {
		// session was renewed
	}
} catch (e) {
	// invalid session id
}
```

### Get the session and user

[`validateSessionUser()`](/reference/api/server-api#validatesessionuser) is similar to `validateSession()` to but it will return both the session and user, fetching them in a single database call.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateSessionUser(sessionId);
	if (session.isFresh) {
		// session was renewed
	}
} catch (e) {
	// invalid session id
}
```
