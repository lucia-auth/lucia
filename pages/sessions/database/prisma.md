---
title: "Sessions with Prisma"
---

# Sessions with Prisma

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

```ts
import type { User, Session } from "@prisma/client";

export async function createSession(userId: number): Promise<Session> {
	// TODO
}

export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
	// TODO
}

export async function invalidateSession(sessionId: string): Promise<void> {
	// TODO
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
```

The session ID should be a random string. We recommend generating at least 20 random bytes from a secure source (**DO NOT USE `Math.random()`**) and encoding it with base32. You can use any encoding schemes, but base32 is case insensitive unlike base64 and only uses alphanumeric letters while being more compact than hex encoding. We'll set the expiration to 30 days.

The example uses the Web Crypto API for generating random bytes, which is available in most modern runtimes. If your runtime doesn't support it, similar runtime-specific alternatives are available. Do not use user-land RNGs.

- [`crypto.randomBytes()`](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) for older versions of Node.js.
- [`expo-random`](https://docs.expo.dev/versions/v49.0.0/sdk/random/) for Expo.
- [`react-native-get-random-bytes`](https://github.com/LinusU/react-native-get-random-values) for React Native.

```ts
import { prisma } from "./db.js";
import { encodeBase32 } from "@oslojs/encoding";

// ...

export async function createSession(userId: number): Session {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
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

// ...

export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
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
	await db.session.delete(sessionId);
}
```

Here's the full code:

```ts
import { db } from "./db.js";
import { encodeBase32 } from "@oslojs/encoding";

import type { User, Session } from "@prisma/client";

export async function createSession(userId: number): Session {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
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

export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
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
