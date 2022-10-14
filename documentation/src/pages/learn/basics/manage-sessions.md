---
order: 8
layout: "@layouts/DocumentLayout.astro"
title: "Manage sessions"
---

Updating the current session will not be automatically reflected in the client. Make sure to refresh the page after it.

## Refresh sessions

Sessions can be refreshed using the [`refreshSession()`](/reference/api/server-api#refreshsession) method. This takes in a refresh token and creates a new access and refresh token. The old refresh token will be invalidated. Returns a new session and tokens.

```ts
import { auth } from "$lib/server/lucia";

try {
    const { session, tokens } = await auth.refreshSession(refreshToken);
} catch {
    // invalid refresh token
}
```

## Invalidate session

### Specific session

To invalidate a session connected to an access token, use the [`invalidateSession()`](/reference/api/server-api#invalidatesession) method. This does not delete the refresh token created with the target access token. Will succeed regardless of the validity of the token.

```ts
import { auth } from "$lib/server/lucia";

await auth.invalidateSession(accessToken);
```

### All sessions of a user

To invalidate all the sessions of a user, use the [`invalidateAllUserSessions()`](/reference/api/server-api#invalidateallusersessions) method. This does not invalidate any refresh tokens of the target user. Will succeed regardless of the validity of the user id.

```ts
import { auth } from "$lib/server/lucia";

await auth.invalidateAllUserSessions(userId);
```
