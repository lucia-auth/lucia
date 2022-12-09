---
order: 6
layout: "@layouts/DocumentLayout.astro"
title: "Manage sessions"
---

## Renew sessions

Sessions can be renewed using the [`renewSession()`](/reference/api/server-api#renewsession) method. This takes in an active or idle session, and the used session will be invalidated. This session should be stored as a cookie.

```ts
import { auth } from "./lucia.js";

try {
	const renewedSession = await auth.renewSession(sessionId);
} catch {
	// invalid refresh token
}
```

## Invalidate sessions

### A specific session

To invalidate a session from a session id, use the [`invalidateSession()`](/reference/api/server-api#invalidatesession) method. Will succeed regardless of the validity of the session id.

```ts
import { auth } from "./lucia.js";

await auth.invalidateSession(sessionId);
```

### All sessions of a user

To invalidate all the sessions of a user, use the [`invalidateAllUserSessions()`](/reference/api/server-api#invalidateallusersessions) method. Will succeed regardless of the validity of the user id.

```ts
import { auth } from "./lucia.js";

await auth.invalidateAllUserSessions(userId);
```
