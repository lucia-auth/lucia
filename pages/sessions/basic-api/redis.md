---
title: "Sessions with Redis"
---

# Sessions with Redis

Users will use a session token linked to a session instead of the ID directly. The session ID will be the SHA-256 hash of the token. SHA-256 is a one-way hash function. This ensures that even if the database contents were leaked, the attacker won't be able retrieve valid tokens.

This page uses [Oslo](https://oslojs.dev) for various operations to support a wide range of runtimes. Oslo packages are fully-typed, lightweight, and has minimal dependencies. These packages are optional and can be replaced by runtime built-ins.

```
npm i @oslojs/encoding @oslojs/crypto
```

Here's what our API will look like. What each method does should be pretty self explanatory.

```ts
import { redis } from "./redis.js";

export function generateSessionToken(): string {
	// TODO
}

export async function createSession(token: string, userId: number): Promise<Session> {
	// TODO
}

export async function validateSessionToken(token: string): Promise<Session | null> {
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

The session token should be a random string. We recommend generating at least 20 random bytes from a secure source (**DO NOT USE `Math.random()`**) and encoding it with base32. You can use any encoding schemes, but base32 is case insensitive unlike base64 and only uses alphanumeric letters while being more compact than hex encoding.

The example uses the Web Crypto API for generating random bytes, which is available in most modern runtimes. If your runtime doesn't support it, similar runtime-specific alternatives are available. Do not use user-land RNGs.

- [`crypto.randomBytes()`](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) for older versions of Node.js.
- [`expo-random`](https://docs.expo.dev/versions/v49.0.0/sdk/random/) for Expo.
- [`react-native-get-random-bytes`](https://github.com/LinusU/react-native-get-random-values) for React Native.

```ts
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

// ...

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}
```

> You can use UUID v4 here but the RFC does not mandate that IDs are generated using a secure random source. Do not use libraries that are not clear on the source they use. Do not use other UUID versions as they do not offer the same entropy size as v4. Consider using [`Crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID).

The session ID will be SHA-256 hash of the token. We'll set the expiration to 30 days.

```ts
import { redis } from "./redis.js";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

// ...

export async function createSession(token: string, userId: number): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
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

```ts
import { redis } from "./redis.js";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

// ...

export async function validateSessionToken(token: string): Promise<Session | null> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const item = await redis.get(`session:${sessionId}`);
	if (item === null) {
		return null;
	}
	const result = JSON.parse(item);
	const session: Session = {
		id: result.id,
		userId: result.user_id,
		expiresAt: new Date(result.expires_at * 1000)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		await redis.delete(`session:${sessionId}`);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
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
	}
	return session;
}
```

Finally, invalidate sessions by simply deleting it from the database.

```ts
import { redis } from "./redis.js";

// ...

export async function invalidateSession(sessionId: string): Promise<void> {
	await redis.delete(`session:${sessionId}`);
}
```

Here's the full code:

```ts
import { redis } from "./redis.js";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userId: number): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
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

export async function validateSessionToken(token: string): Promise<Session | null> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const item = await redis.get(`session:${sessionId}`);
	if (item === null) {
		return null;
	}
	const result = JSON.parse(item);
	const session: Session = {
		id: result.id,
		userId: result.user_id,
		expiresAt: new Date(result.expires_at * 1000)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		await redis.delete(`session:${sessionId}`);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
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
	}
	return session;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await redis.delete(`session:${sessionId}`);
}

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
```

## Using your API

When a user signs in, generate a session token with `generateSessionToken()` and create a session linked to it with `createSession()`. The token is provided to the user client.

```ts
import { generateSessionToken, createSession } from "./session.js";

const token = generateSessionToken();
const session = createSession(token, userId);
setSessionTokenCookie(token);
```

Validate a user-provided token with `validateSessionToken()`.

```ts
import { validateSessionToken } from "./session.js";

const token = cookies.get("session");
if (token !== null) {
	const session = validateSessionToken(token);
}
```

To learn how to store the token on the client, see the [Session cookies](/sessions/cookies) page.
