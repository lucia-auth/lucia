---
title: "Sessions with Redis"
---

# Sessions with Redis

Here's what our API will look like. What each method does should be pretty self explanatory.

```ts
import { redis } from "./redis.js";

export async function createSession(userId: number): Promise<Session> {
	// TODO
}

export async function validateSession(sessionId: string): Promise<Session> {
	// TODO
}

export async function invalidateSession(sessionId: string): Promise<void> {
	// TODO
}

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
```

The session ID should be a random string. We recommend generating at least 20 random bytes from a secure source (**DO NOT USE `Math.random()`**) and encoding it with base32. You can use any encoding schemes, but base32 is case insensitive unlike base64 and only uses alphanumeric letters while being more compact than hex encoding. We'll set the expiration to 30 days.

The example uses the Web Crypto API for generating random bytes, which is available in most modern runtimes. If your runtime doesn't support it, similar runtime-specific alternatives are available. Do not use user-land RNGs.

- [`crypto.randomBytes()`](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) for older versions of Node.js.
- [`expo-random`](https://docs.expo.dev/versions/v49.0.0/sdk/random/) for Expo.
- [`react-native-get-random-bytes`](https://github.com/LinusU/react-native-get-random-values) for React Native.

```ts
import { redis } from "./redis.js";
import { encodeBase32 } from "@oslojs/encoding";

// ...

export async function createSession(userId: number): Promise<Session> {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await redis.set(
		`session:${session.id}`,
		JSON.stringify({
			id: session.id,
			user_id: session.userId,
			expires_at: Math.floor(session.expiresAt / 1000)
		}),
		{
			EXAT: Math.floor(session.expiresAt / 1000)
		}
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
import { redis } from "./redis.js";

// ...

export async function validateSession(sessionId: string): Promise<Session> {
	const item = await redis.get(`session:${sessionId}`);
	if (item === null) {
		return { session: null, user: null };
	}
	const result = JSON.parse(item);
	const session: Session = {
		id: result.id,
		userId: result.user_id,
		expiresAt: new Date(result.expires_at * 1000)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute("DELETE FROM session WHERE id = ?", session.id);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute("UPDATE session SET expires_at = ? WHERE id = ?", Math.floor(session.expiresAt / 1000), session.id);
	}
	return session;
}
```

Finally, invalidate sessions by simply deleting it from the database.

```ts
import { redis } from "./redis.js";

// ...

export async function invalidateSession(sessionId: string): Promise<void> {
	await redis.delete(sessionId);
}
```

Here's the full code:

```ts
import { redis } from "./redis.js";
import { encodeBase32 } from "@oslojs/encoding";

export async function createSession(userId: number): Promise<Session> {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await redis.set(
		`session:${session.id}`,
		JSON.stringify({
			id: session.id,
			user_id: session.userId,
			expires_at: Math.floor(session.expiresAt / 1000)
		}),
		{
			EXAT: Math.floor(session.expiresAt / 1000)
		}
	);
	return session;
}

export async function validateSession(sessionId: string): Promise<Session> {
	const item = await redis.get(`session:${sessionId}`);
	if (item === null) {
		return { session: null, user: null };
	}
	const result = JSON.parse(item);
	const session: Session = {
		id: result.id,
		userId: result.user_id,
		expiresAt: new Date(result.expires_at * 1000)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute("DELETE FROM session WHERE id = ?", session.id);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute("UPDATE session SET expires_at = ? WHERE id = ?", Math.floor(session.expiresAt / 1000), session.id);
	}
	return session;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await redis.delete(sessionId);
}

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
```
