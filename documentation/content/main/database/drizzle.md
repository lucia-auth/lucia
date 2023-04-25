---
_order: 0
title: "Drizzle ORM"
description: "Learn how to use Drizzle ORM with Lucia"
---

[Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) is a TypeScript ORM for SQL databases designed with maximum type safety in mind.

Lucia does not provide an adapter for Drizzle itself, rather supporting the underling drivers instead.

## Supported drivers

| language   | drivers                                                        |
| ---------- | -------------------------------------------------------------- |
| MySQL      | [`mysql2`](https://github.com/sidorares/node-mysql2)           |
| PostgreSQL | [`pg`](https://github.com/brianc/node-postgres)                |
| SQLite     | [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) |

## MySQL

Use [the MySQL adapter](/database/mysqls).

```ts
import { mysqlTable, bigint, varchar, boolean } from "drizzle-orm/mysql-core";

const user = mysqlTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey()
	// other user attributes
});

const session = mysqlTable("auth_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	activeExpires: bigInt("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigInt("idle_expires", {
		mode: "number"
	}).notNull()
});

const key = mysqlTable("auth_session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	primaryKey: boolean().notNull(),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});
```

### `mysql2`

Refer to the [`mysql2`](/database/mysql#mysql2) section.

```ts
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import lucia from "lucia-auth";
import { mysql2 } from "@lucia-auth/adapter-mysql";

const connectionPool = mysql.createPool({
	// ...
});

const db = drizzle(poolConnection);

const auth = lucia({
	adapter: mysql2(connectionPool)
	// ...
});
```

## PostgreSQL

Use [the PostgreSQL adapter](/database/postgresql).

```ts
import { pgTable, bigint, varchar, boolean } from "drizzle-orm/pg-core";

const user = pgTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey()
	// other user attributes
});

const session = pgTable("auth_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	activeExpires: bigInt("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigInt("idle_expires", {
		mode: "number"
	}).notNull()
});

const key = pgTable("auth_session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	primaryKey: boolean().notNull(),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});
```

### `pg`

Refer to the [`pg`](/database/postgresql#pg) section.

```ts
import postgres from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import lucia from "lucia-auth";
import { pg } from "@lucia-auth/adapter-postgresql";

const connectionPool = new postgres.Pool({
	// ...
});

const db = drizzle(poolConnection);

const auth = lucia({
	adapter: pg(connectionPool)
	// ...
});
```

## SQLite

Use [the SQLite adapter](/database/sqlite).

```ts
import { sqliteTable, varchar, integer } from "drizzle-orm/sqlite-core";

const user = mysqlTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey()
	// other user attributes
});

const session = mysqlTable("auth_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	activeExpires: integer("active_expires").notNull(),
	idleExpires: integer("idle_expires").notNull()
});

const key = mysqlTable("auth_session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	primaryKey: integer().notNull(),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});
```

### `better-sqlite3`

Refer to the [`better-sqlite3`](/database/sqlite#better-sqlite3) section.

```ts
import sqlite from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import lucia from "lucia-auth";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";

const database = sqlite(pathToDbFile);

const db = drizzle(database);

const auth = lucia({
	adapter: betterSqlite3(database)
	// ...
});
```
