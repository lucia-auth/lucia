---
layout: "@layouts/DocLayout.astro"
title: "SQLite"
---

The `@lucia-auth/adapter-sqlite` package provides adapters for SQLites drivers:

- `better-sqlite3`
- Bun SQLite (`bun:sqlite`)
- Cloudflare D1
- LibSQL (Turso)

```
npm install @lucia-auth/adapter-sqlite
```

## Schema

```sql
CREATE TABLE user (
    id TEXT NOT NULL PRIMARY KEY
)

CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at INTEGER NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
)
```

## Drivers

### `better-sqlite3`

`BetterSqlite3Adapter` takes a `Database` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import sqlite from "better-sqlite3";

const db = sqlite();

const lucia = new Lucia(
	new BetterSqlite3Adapter(db, {
		user: "user",
		session: "session"
	})
);
```

### Bun SQLite

`BunSQLiteAdapter` takes a `Database` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { BunSQLiteAdapter } from "@lucia-auth/adapter-sqlite";
import { Database } from "bun:sqlite";

const db = new Database();

const lucia = new Lucia(
	new BunSQLiteAdapter(db, {
		user: "user",
		session: "session"
	})
);
```

### Cloudflare D1

`CloudflareD1Adapter` takes a `D1Database` instance and a list of table names.

Since the D1 binding is included with the request, create an `initializeLucia()` function to create a new `Lucia` instance on every request.

```ts
import { Lucia } from "lucia";
import { CloudflareD1Adapter } from "@lucia-auth/adapter-sqlite";

export function initializeLucia(D1: D1Database) {
	return new Lucia(
		new CloudflareD1Adapter(D1, {
			user: "user",
			session: "session"
		})
	);
}

declare module "lucia" {
	interface Register {
		Auth: ReturnType<typeof initializeLucia>;
	}
}
```

### LibSQL

`LibSQLAdapter` takes a `D1Database` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { LibSQLAdapter } from "@lucia-auth/adapter-sqlite";
import { createClient } from "@libsql/client";

const db = createClient({
	url: "file:test/main.db"
});

const lucia = new Lucia(
	new LibSQLAdapter(db, {
		user: "user",
		session: "session"
	})
);
```
