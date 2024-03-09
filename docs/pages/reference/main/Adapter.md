---
title: "Adapter"
---

# `Adapter`

Represents a database adapter.

## Definition

```ts
//$ DatabaseSession=/reference/main/DatabaseSession
//$ DatabaseUser=/reference/main/DatabaseUser
//$ UserId=/reference/main/UserId
interface Adapter {
	deleteExpiredSessions(): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: $$UserId): Promise<void>;
	getSessionAndUser(
		sessionId: string
	): Promise<[session: $$DatabaseSession | null, user: $$DatabaseUser | null]>;
	getUserSessions(userId: $$UserId): Promise<$$DatabaseSession[]>;
	setSession(session: $$DatabaseSession): Promise<void>;
	updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void>;
}
```

### Methods

-   `deleteExpiredSessions`: Deletes all sessions where `expires_at` is equal to or less than current timestamp (machine time)
-   `deleteSession()`: Deletes the session
-   `deleteUserSessions()`: Deletes all sessions linked to the user
-   `getSessionAndUser()`: Returns the session and the user linked to the session
-   `getUserSessions()`: Returns all sessions linked to a user
-   `setSession()`: Inserts the session
-   `updateSessionExpiration()`: Updates the `expires_at` field of the session
