---
title: "Sessions with SQLite"
---

# Sessions with SQLite

## Declare your schema

Create a session table with a field for a text ID, user ID, and expiration. We'll store the expiration date as a UNIX timestamp (seconds) but how you store these attributes is up to you.

```
CREATE TABLE user (
    id INTEGER NOT NULL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
);


CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);
```

## Create your API

Here's what our API will look like. What each method does should be pretty self explanatory.

```ts
import { db } from "./db.js";

export function createSession(userId: number): Session {
	// TODO
}

export function validateSession(sessionId: string): SessionValidationResult {
	// TODO
}

export function invalidateSession(sessionId: string): void {
	// TODO
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}

export interface User {
	id: number;
}
```

The session ID should be a random string. We recommend generating at least 20 random bytes from a secure source (**DO NOT USE `Math.random()`**) and encoding it with base32. You can use any encoding schemes, but base32 is case insensitive unlike base64 and only uses alphanumeric letters while being more compact than hex encoding. We'll set the expiration to 30 days.

The example uses the Web Crypto API for generating random bytes, which is available in most modern runtimes. If your runtime doesn't support it, similar runtime-specific alternatives are available. Do not use user-land RNGs.

- [`crypto.randomBytes()`](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) for older versions of Node.js.
- [`expo-random`](https://docs.expo.dev/versions/v49.0.0/sdk/random/) for Expo.
- [`react-native-get-random-bytes`](https://github.com/LinusU/react-native-get-random-values) for React Native.

```ts
import { db } from "./db.js";
import { encodeBase32 } from "@oslojs/encoding";

// ...

export function createSession(userId: number): Session {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	db.execute(
		"INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)",
		session.id,
		session.userId,
		Math.floor(session.expiresAt / 1000)
	);
	return session;
}
```

Sessions are validated in 2 steps:

1. Does the session exist in your database?
2. Is it still within expiration?

We'll also extend the session expiration when it's close to expiration. This ensures active sessions are persisted, while inactive ones will eventually expire. We'll handle this by checking if there's less than 15 days (half of the 30 day expiration) before expiration.

For convenience, we'll return both the session and user object tied to the session ID.

```ts
import { db } from "./db.js";

// ...

export function validateSession(sessionId: string): SessionValidationResult {
	const row = db.queryOne(
		"SELECT session.id, session.user_id, session.expires_at, user.id FROM session INNER JOIN user ON user.id = session.user_id WHERE id = ?",
		sessionId
	);
	if (row === null) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row[0],
		userId: row[1],
		expiresAt: new Date(row[2] * 1000)
	};
	const user: User = {
		id: row[3]
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute("DELETE FROM session WHERE id = ?", session.id);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute("UPDATE session SET expires_at = ? WHERE id = ?", Math.floor(session.expiresAt / 1000), session.id);
	}
	return { session, user };
}
```

Finally, invalidate sessions by simply deleting it from the database.

```ts
import { db } from "./db.js";

// ...

export function invalidateSession(sessionId: string): void {
	db.execute("DELETE FROM session WHERE id = ?", sessionId);
}
```

Here's the full code:

```ts
import { db } from "./db.js";
import { encodeBase32 } from "@oslojs/encoding";

export function createSession(userId: number): Session {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	db.execute(
		"INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)",
		session.id,
		session.userId,
		Math.floor(session.expiresAt / 1000)
	);
	return session;
}

export function validateSession(sessionId: string): SessionValidationResult {
	const row = db.queryOne(
		"SELECT session.id, session.user_id, session.expires_at, user.id FROM session INNER JOIN user ON user.id = session.user_id WHERE id = ?",
		sessionId
	);
	if (row === null) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row[0],
		userId: row[1],
		expiresAt: new Date(row[2] * 1000)
	};
	const user: User = {
		id: row[3]
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute("DELETE FROM session WHERE id = ?", session.id);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute("UPDATE session SET expires_at = ? WHERE id = ?", Math.floor(session.expiresAt / 1000), session.id);
	}
	return { session, user };
}

export function invalidateSession(sessionId: string): void {
	db.execute("DELETE FROM session WHERE id = ?", sessionId);
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}

export interface User {
	id: number;
}
```
