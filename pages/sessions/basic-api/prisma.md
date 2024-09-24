---
title: "Sessions with Prisma"
---

# Sessions with Prisma

Users will use a session token linked to a session instead of the ID directly. The session ID will be the SHA-256 hash of the token. SHA-256 is a one-way hash function. This ensures that even if the database contents were leaked, the attacker won't be able retrieve valid tokens.

## Declare your schema

Create a session model with a field for a text ID, user ID, and expiration.

```
model User {
  id       Int       @id @default(autoincrement())
  sessions Session[]
}

model Session {
  id        String   @id
  userId    Int
  expiresAt DateTime

  user      User     @relation(references: [id], fields: [userId], onDelete: Cascade)
}
```

## Create your API

Here's what our API will look like. What each method does should be pretty self explanatory.

If you just need the code full code without the explanation, skip to the end of this section.

```ts
import type { User, Session } from "@prisma/client";

export function generateSessionToken(): string {
	// TODO
}

export async function createSession(token: string, userId: number): Promise<Session> {
	// TODO
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	// TODO
}

export async function invalidateSession(sessionId: string): Promise<void> {
	// TODO
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
```

The session token should be a random string. We recommend generating at least 20 random bytes from a secure source (**DO NOT USE `Math.random()`**) and encoding it with base32. You can use any encoding schemes, but base32 is case insensitive unlike base64 and only uses alphanumeric letters while being more compact than hex encoding.

The example uses the Web Crypto API for generating random bytes, which is available in most modern runtimes. If your runtime doesn't support it, similar runtime-specific alternatives are available. Do not use user-land RNGs.

- [`crypto.randomBytes()`](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) for older versions of Node.js.
- [`expo-random`](https://docs.expo.dev/versions/v49.0.0/sdk/random/) for Expo.
- [`react-native-get-random-bytes`](https://github.com/LinusU/react-native-get-random-values) for React Native.

```ts
import { encodeBase32 } from "@oslojs/encoding";

// ...

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}
```

> Throughout the site, we will use packages from [Oslo](https://oslojs.dev) for various operations. Oslo packages are fully-typed, lightweight, and has minimal dependencies. You can of course replace them with your own code, runtime-specific modules, or your preferred library.

The session ID will be SHA-256 hash of the token. We'll set the expiration to 30 days.

```ts
import { prisma } from "./db.js";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

// ...

export async function createSession(token: string, userId: number): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await prisma.session.create({
		data: session
	});
	return session;
}
```

Sessions are validated in 2 steps:

1. Does the session exist in your database?
2. Is it still within expiration?

We'll also extend the session expiration when it's close to expiration. This ensures active sessions are persisted, while inactive ones will eventually expire. We'll handle this by checking if there's less than 15 days (half of the 30 day expiration) before expiration.

For convenience, we'll return both the session and user object tied to the session ID.

```ts
import { prisma } from "./db.js";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

// ...

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await prisma.session.findUnique({
		where: {
			id: sessionId
		},
		include: {
			user: true
		}
	});
	if (result === null) {
		return { session: null, user: null };
	}
	const { user, ...session } = result;
	if (Date.now() >= session.expiresAt.getTime()) {
		await prisma.session.delete(sessionId);
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await prisma.session.update({
			where: {
				id: session.id
			},
			data: {
				expiresAt: session.expiresAt
			}
		});
	}
	return { session, user };
}
```

Finally, invalidate sessions by simply deleting it from the database.

```ts
import { prisma } from "./db.js";

// ...

export async function invalidateSession(sessionId: string): void {
	await prisma.session.delete(sessionId);
}
```

Here's the full code:

```ts
import { prisma } from "./db.js";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import type { User, Session } from "@prisma/client";

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: number): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await prisma.session.create({
		data: session
	});
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await prisma.session.findUnique({
		where: {
			id: sessionId
		},
		include: {
			user: true
		}
	});
	if (result === null) {
		return { session: null, user: null };
	}
	const { user, ...session } = result;
	if (Date.now() >= session.expiresAt.getTime()) {
		await prisma.session.delete(sessionId);
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await prisma.session.update({
			where: {
				id: session.id
			},
			data: {
				expiresAt: session.expiresAt
			}
		});
	}
	return { session, user };
}

export async function invalidateSession(sessionId: string): void {
	await db.session.delete(sessionId);
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
```

## Using your API

When a user signs in, generate a session token with `generateSessionToken()` and create a session linked to it with `createSession()`. The token is provided to the user client.

```ts
import { generateSessionToken, createSession } from "./auth.js";

const token = generateSessionToken();
const session = createSession(token, userId);
setSessionTokenCookie(session);
```

Validate a user-provided token with `validateSessionToken()`.

```ts
import { validateSessionToken } from "./auth.js";

const token = cookies.get("session");
if (token !== null) {
	const { session, user } = validateSessionToken(token);
}
```

To learn how to store the token on the client, see the [Session cookies](/sessions/cookies) page.
