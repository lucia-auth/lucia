---
title: "Using Drizzle ORM"
description: "Learn how to use Drizzle ORM with Lucia"
---

[Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) is a TypeScript ORM for SQL databases designed with maximum type safety in mind. While Lucia doesn't provide an adapter for Drizzle itself, it does provide adapters for most database drivers supported by Drizzle.

## MySQL

Make sure to change the table names accordingly. While you can name your Drizzle fields anything you want, the underlying column names must match what's defined in the docs (e.g `user_id`). 

```ts
// schema.js
import { mysqlTable, bigint, varchar } from "drizzle-orm/mysql-core";

export const user = mysqlTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey()
	// other user attributes
});

export const key = mysqlTable("user_key", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});

export const session = mysqlTable("user_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	activeExpires: bigint("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigint("idle_expires", {
		mode: "number"
	}).notNull()
});
```

### `mysql2`

Install `mysql2` and follow the [adapter documentation](/database-adapters/mysql2) to setup your database.

```
npm install mysql2
```

Create a new `Pool` from `mysql/promise` and use it to initialize both Drizzle and Lucia.

```ts
// db.js
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";

export const pool = mysql.createPool({
	// ...
});

export const db = drizzle(pool);
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { mysql2 } from "@lucia-auth/adapter-mysql";

import { pool } from "./db.js";

export const auth = lucia({
	adapter: mysql2(pool, tableNames)
});
```

### `@planetscale/database`

Remove all `references()` from the schema since Planetscale does not support foreign keys from `key` and `session`. For example:

```ts
export const key = mysqlTable("user_key", {
	// ...
	userId: varchar("user_id", {
		length: 15
	}).notNull()
	// .references(() => user.id)

	// ...
});
```

Install `@planetscale/database` and follow the [adapter documentation](/database-adapters/planetscale-serverless) to setup your database.

```
npm install @planetscale/database
```

Create a new connection and use it to initialize both Drizzle and Lucia.

```ts
// db.js
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";

export const connection = connect({
	// ...
});

export const db = drizzle(connection);
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { planetscale } from "@lucia-auth/adapter-mysql";

import { connection } from "./db.js";

export const auth = lucia({
	adapter: planetscale(connection, tableNames)
});
```

## PostgreSQL

We recommend using `pg` with TCP connections for Supabase and Neon.

Make sure to change the table names accordingly. While you can name your Drizzle fields anything you want, the underlying column names must match what's defined in the docs (e.g `user_id`). 

```ts
// schema.js
import { pgTable, bigint, varchar } from "drizzle-orm/pg-core";

export const user = pgTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey()
	// other user attributes
});

export const session = pgTable("user_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	activeExpires: bigint("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigint("idle_expires", {
		mode: "number"
	}).notNull()
});

export const key = pgTable("user_key", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});
```

### `pg`

Install `pg` and follow the [adapter documentation](/database-adapters/pg) to setup your database.

```
npm install pg
```

Create a new `Pool` and use it to initialize both Drizzle and Lucia.

```ts
// db.js
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const pool = new Pool({
	// ...
});

export const db = drizzle(pool);
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { pg } from "@lucia-auth/adapter-postgresql";

import { pool } from "./db.js";

export const auth = lucia({
	adapter: pg(pool, tableNames)
});
```

## `postgres`

Install `postgres` and follow the [adapter documentation](/database-adapters/postgres) to setup your database.

```
npm install postgres
```

Create a new connection and use it to initialize both Drizzle and Lucia.

```ts
// db.js
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const queryClient = postgres(/* ... */);

export const db: PostgresJsDatabase = drizzle(queryClient);
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { postgres as postgresAdapter } from "@lucia-auth/adapter-postgresql";

import { queryClient } from "./db.js";

export const auth = lucia({
	adapter: postgresAdapter(queryClient, tableNames)
});
```

## SQLite

Make sure to change the table names accordingly. While you can name your Drizzle fields anything you want, the underlying column names must match what's defined in the docs (e.g `user_id`). 

```ts
// schema.js
import { sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey()
	// other user attributes
});

export const session = sqliteTable("user_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	activeExpires: blob("active_expires", {
		mode: "bigint"
	}).notNull(),
	idleExpires: blob("idle_expires", {
		mode: "bigint"
	}).notNull()
});

export const key = sqliteTable("user_key", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	hashedPassword: text("hashed_password")
});
```

### `better-sqlite3`

Install `better-sqlite3` and follow the [adapter documentation](/database-adapters/better-sqlite3) to setup your database.

```
npm install better-sqlite3
```

Create a new `Database` and use it to initialize both Drizzle and Lucia.

```ts
// db.js
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import sqlite from "better-sqlite3";

export const sqliteDatabase = sqlite(/* ... */);

export const db: BetterSQLite3Database = drizzle(sqliteDatabase);
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";

import { sqliteDatabase } from "./db.js";

export const auth = lucia({
	adapter: betterSqlite3(sqliteDatabase, tableNames)
});
```

### Cloudflare D1

Follow the [adapter documentation](/database-adapters/cloudflare-d1) to setup your database.

```ts
import { drizzle } from "drizzle-orm/d1";

const initializeDrizzle = (db: D1Database) => {
	return drizzle(db);
};

const initializeLucia = (db: D1Database) => {
	const auth = lucia({
		adapter: d1(db, tableNames)
		// ...
	});
	return auth;
};
```

### libSQL (Turso)

Install `@libsql/client` and follow the [adapter documentation](/database-adapters/libsql) to setup your database.

```
npm install @libsql/client
```

Create a new client and use it to initialize both Drizzle and Lucia.

```ts
// db.js
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

export const libsqlClient = createClient({
	// ...
});

export const db = drizzle(libsqlClient);
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { libsql } from "@lucia-auth/adapter-sqlite";

import { libsqlClient } from "./db.js";

export const auth = lucia({
	adapter: libsql(libsqlClient, tableNames)
});
```
