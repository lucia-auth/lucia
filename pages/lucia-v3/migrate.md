---
title: "Migrate from Lucia v3"
---

# Migrate from Lucia v3

Lucia v3 has been deprecated. Lucia is now a learning resource for implementing sessions and more.

## Background

We ultimately came to the conclusion that it'd be easier and faster to just implement sessions from scratch. The database adapter model wasn't flexible enough for such a low-level library and severely limited the library design.

## Migrating your project

Replacing Lucia v3 with your own implementation should be a straight-forward path, especially since most of your knowledge will still be very useful. No database migrations are necessary.

If you're fine with invalidating all sessions (and signing out everyone), consider reading through the [new implementation guide](/sessions/basic). The new API is more secure and patches out a very impractical timing attack (see code below for details).

### Sessions

```ts
function generateSessionId(): string {
	const bytes = new Uint8Array(25);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

const sessionExpiresInSeconds = 60 * 60 * 24 * 30; // 30 days

export function createSession(dbPool: DBPool, userId: number): Promise<Session> {
	const now = new Date();
	const sessionId = generateSessionId();
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(now.getTime() + 1000 * sessionExpiresInSeconds)
	};
	await executeQuery(
		dbPool,
		"INSERT INTO user_session (id, user_id, expires_at) VALUES (?, ?, ?)",
		[session.id, session.userId, Math.floor(session.expiresAt.getTime() / 1000)]
	);
	return session;
}

export function validateSession(dbPool: DBPool, sessionId: string): Promise<Session | null> {
	const now = Date.now();

	// This may be vulnerable to a timing attack where an attacker can measure the response times
	// to guess a valid session ID.
	// A more common pattern is a string comparison against a secret using the === operator.
	// The === operator is not constant time and the same can be said about SQL = operators.
	// Some remote timing attacks has been proven to be possible but there hasn't been a successful
	// recorded attack on real-world applications targeting similar vulnerabilities.
	const result = dbPool.executeQuery(
		dbPool,
		"SELECT id, user_id, expires_at FROM session WHERE id = ?",
		[sessionId]
	);
	if (result.rows.length < 1) {
		return null;
	}
	const row = result.rows[0];
	const session: Session = {
		id: row[0],
		userId: row[1],
		expiresAt: new Date(row[2] * 1000)
	};
	if (now.getTime() >= session.expiresAt.getTime()) {
		await executeQuery(dbPool, "DELETE FROM user_session WHERE id = ?", [session.id]);
		return null;
	}
	if (now.getTime() >= session.expiresAt.getTime() - (1000 * sessionExpiresInSeconds) / 2) {
		session.expiresAt = new Date(Date.now() + 1000 * sessionExpiresInSeconds);
		await executeQuery(dbPool, "UPDATE session SET expires_at = ? WHERE id = ?", [
			Math.floor(session.expiresAt.getTime() / 1000),
			session.id
		]);
	}
	return session;
}

export async function invalidateSession(dbPool: DBPool, sessionId: string): Promise<void> {
	await executeQuery(dbPool, "DELETE FROM user_session WHERE id = ?", [sessionId]);
}

export async function invalidateAllSessions(dbPool: DBPool, userId: number): Promise<void> {
	await executeQuery(dbPool, "DELETE FROM user_session WHERE user_id = ?", [userId]);
}

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
```

### Cookies

Cookies should have the following attributes:

- `HttpOnly`: Cookies are only accessible server-side.
- `SameSite=Lax`: Use Strict for critical websites.
- `Secure`: Cookies can only be sent over HTTPS (should be omitted when testing on localhost).
- `Max-Age` or `Expires`: Must be defined to persist cookies.
- `Path=/`: Cookies can be accessed from all routes.

```ts
export function setSessionCookie(response: HTTPResponse, sessionId: string, expiresAt: Date): void {
	if (env === ENV.PROD) {
		response.headers.add(
			"Set-Cookie",
			`session=${sessionId}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/; Secure;`
		);
	} else {
		response.headers.add(
			"Set-Cookie",
			`session=${sessionId}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/`
		);
	}
}

// Set empty session cookie that expires immediately.
export function deleteSessionCookie(response: HTTPResponse): void {
	if (env === ENV.PROD) {
		response.headers.add(
			"Set-Cookie",
			"session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Secure;"
		);
	} else {
		response.headers.add("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/");
	}
}
```
