---
title: "Sessions with Drizzle ORM"
---

# Sessions with Drizzle ORM

## Declare your schema

Create a session model with a field for an ID, user ID, and expiration.

### MySQL

```ts
import mysql from "mysql2/promise";
import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";

import type { InferSelectModel } from "drizzle-orm";

const connection = await mysql.createConnection();
const db = drizzle(connection);

export const userTable = mysqlTable("user", {
	id: int("id").primaryKey().autoincrement()
});

export const sessionTable = mysqlTable("session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: int("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: datetime("expires_at").notNull()
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
```

### PostgreSQL

```ts
import pg from "pg";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new pg.Pool();
const db = drizzle(pool);

const userTable = pgTable("user", {
	id: serial("id").primaryKey()
});

const sessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull()
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
```

### SQLite

```ts
import sqlite from "better-sqlite3";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqliteDB = sqlite(":memory:");
const db = drizzle(sqliteDB);

const userTable = sqliteTable("user", {
	id: integer("id").primaryKey()
});

const sessionTable = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer("expires_at", {
		mode: "timestamp"
	}).notNull()
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
```

## Create your API

Here's what our API will look like. What each method does should be pretty self explanatory.

```ts
import type { User, Session } from "./db.js";

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
import { db, userTable, sessionTable } from "./db.js";
import { eq } from "drizzle-orm";

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
	await db.insert(sessionTable).values(session);
	return session;
}
```

Sessions are validated in 2 steps:

1. Does the session exist in your database?
2. Is it still within expiration?

We'll also extend the session expiration when it's close to expiration. This ensures active sessions are persisted, while inactive ones will eventually expire. We'll handle this by checking if there's less than 15 days (half of the 30 day expiration) before expiration.

For convenience, we'll return both the session and user object tied to the session ID.

```ts
import { db, userTable, sessionTable } from "./db.js";
import { eq } from "drizzle-orm";

// ...

export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
	const result = await db
		.select({ user: userTable, session: sessionTable })
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.where(eq(sessionTable.id, sessionId));
	if (result.length < 1) {
		return { session: null, user: null };
	}
	const { user, session } = result[0];
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(sessionTable)
			.set({
				expiresAt: session.expiresAt
			})
			.where(eq(sessionTable.id, session.id));
	}
	return { session, user };
}
```

Finally, invalidate sessions by simply deleting it from the database.

```ts
import { eq } from "drizzle-orm";
import { db, userTable, sessionTable } from "./db.js";

// ...

export async function invalidateSession(sessionId: string): void {
	await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
}
```

Here's the full code:

```ts
import { db, userTable, sessionTable } from "./db.js";
import { eq } from "drizzle-orm";
import { encodeBase32 } from "@oslojs/encoding";

import type { User, Session } from "./db.js";

export async function createSession(userId: number): Session {
	const sessionIdBytes = new Uint8Array(20);
	crypto.getRandomValues(sessionIdBytes);
	const sessionId = encodeBase32(sessionIdBytes).toLowerCase();
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await db.insert(sessionTable).values(session);
	return session;
}

export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
	const result = await db
		.select({ user: userTable, session: sessionTable })
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.where(eq(sessionTable.id, sessionId));
	if (result.length < 1) {
		return { session: null, user: null };
	}
	const { user, session } = result[0];
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(sessionTable)
			.set({
				expiresAt: session.expiresAt
			})
			.where(eq(sessionTable.id, session.id));
	}
	return { session, user };
}

export async function invalidateSession(sessionId: string): void {
	await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
```
