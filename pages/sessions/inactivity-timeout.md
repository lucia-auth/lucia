---
title: "Inactivity timeout"
---

# Inactivity timeout

This page builds upon the [Basic session implementation](/sessions/basic) page.

Setting an expiration for sessions is recommended, but it'd be annoying if active users were constantly signed-out. Instead of just removing the expiration all together, we recommend implementing an inactivity timeout as a replacement for it. This ensures active users remain signed in while inactive users are signed out after a set period.

First add a `lastVerifiedAt` attribute to your sessions. This would include when the session token was last verified.

```ts
interface Session {
	id: string;
	secretHash: Uint8Array;
	lastVerifiedAt: Date;
	createdAt: Date;
}
```

```
CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    secret_hash BLOB NOT NULL,
    last_verified_at INTEGER NOT NULL, -- unix (seconds)
    created_at INTEGER NOT NULL,
) STRICT;
```

While we can update the attribute after every verification, that would increase our database load dramatically. Instead, we can update the `lastVerifiedAt` attribute after a set period, e.g. 1 hour. It is important to only update the attribute _after_ the token has been verified.

Finally, invalidate sessions that haven't been used recently. Anywhere from 1 day to 30 days would work depending on your application and type of session.

```ts
const inactivityTimeoutSeconds = 60 * 60 * 24 * 10; // 10 days
const activityCheckIntervalSeconds = 60 * 60; // 1 hour

async function validateSessionToken(dbPool: DBPool, token: string): Promise<Session | null> {
	const now = new Date();

	const tokenParts = token.split(".");
	if (tokenParts.length !== 2) {
		return null;
	}
	const sessionId = tokenParts[0];
	const sessionSecret = tokenParts[1];

	const session = await getSession(dbPool, sessionId);
    if (!session) {
        return null;
    }

	const tokenSecretHash = await hashSecret(sessionSecret);
	const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
	if (!validSecret) {
		return null;
	}

	if (now.getTime() - session.lastVerifiedAt.getTime() >= activityCheckIntervalSeconds * 1000) {
		session.lastVerifiedAt = now;
		await executeQuery(dbPool, "UPDATE session SET last_verified_at = ? WHERE id = ?", [
			Math.floor(session.lastVerifiedAt.getTime() / 1000),
			sessionId
		]);
	}

	return session;
}

async function getSession(dbPool: DBPool, sessionId: string): Promise<Session | null> {
	const now = new Date();

	const result = await executeQuery(
		dbPool,
		"SELECT id, secret_hash, last_verified_at, created_at FROM session WHERE id = ?",
		[sessionId]
	);
	if (result.rows.length !== 1) {
		return null;
	}
	const row = result.rows[0];
	const session: Session = {
		id: row[0],
		secretHash: row[1],
		lastVerifiedAt: new Date(row[2] * 1000),
		createdAt: new Date(row[3] * 1000)
	};

	// Inactivity timeout
	if (now.getTime() - session.lastVerifiedAt.getTime() >= inactivityTimeoutSeconds * 1000) {
		await deleteSession(dbPool, sessionId);
		return null;
	}

	return session;
}
```
