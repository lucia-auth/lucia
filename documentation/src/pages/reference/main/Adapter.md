---
layout: "@layouts/DocLayout.astro"
title: "Adapter"
format: "code"
---

Represents a database adapter.

## Definition

```ts
//$ DatabaseSession=/reference/main/DatabaseSession
//$ DatabaseUser=/reference/main/DatabaseUser
interface Adapter {
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: string): Promise<void>;
	getSessionAndUser(
		sessionId: string
	): Promise<[session: $$DatabaseSession | null, user: $$DatabaseUser | null]>;
	getUserSessions(userId: string): Promise<$$DatabaseSession[]>;
	setSession(session: $$DatabaseSession): Promise<void>;
	updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void>;
}
```

### Methods

- `deleteSession()`: Deletes the session
- `deleteUserSessions()`: Deletes all sessions linked to the user
- `getSessionAndUser()`: Returns the session and the user linked to the session
- `getUserSessions()`: Returns all sessions linked to a user
- `setSession()`: Inserts the session
- `updateSessionExpiration()`: Updates the `expires_at` field of the session
