---
title: "Using Kysely"
description: "Learn how to use Kysely with Lucia"
---

[Kysely]() is a type-safe and autocompletion-friendly TypeScript SQL query builder. It uses dialects to support multiple databases, similar to Lucia's adapter. All 3 dialects built-in dialects (MySQL via `mysql2`, PostgreSQL via `pg`, and SQLite via `better-sqlite3`) are supported in Lucia.

See the next section for setting up the dialects, and make sure to change the table names in type `Database` to match your database.

```ts
// db.ts
import { Kysely } from "kysely";

export const db = new Kysely<Database>({
	dialect
});

type Database = {
	user: UserTable;
	key: KeyTable;
	session: SessionTable;
};

type UserTable = {
	id: string;
};

type KeyTable = {
	id: string;
	user_id: string;
	hashed_password: string | null;
};

type SessionTable = {
	id: string;
	user_id: string;
	active_expires: bigint;
	idle_expires: bigint;
};
```

## Dialects

## MySQL

Install `mysql2` and follow the [adapter documentation](/database-adapters/mysql2) to setup your database.

```
npm install mysql2
```

Create a new `Pool` from `mysql/promise` and use it to initialize both Kysely and Lucia.

```ts
// db.ts
import { createPool } from "mysql2/promise";
import { Kysely, MysqlDialect } from "kysely";

export const pool = createPool(/* ... */);

const dialect = new MysqlDialect({
	pool: pool.pool // IMPORTANT NOT TO PASS `pool`
});

export const db = new Kysely<Database>({
	dialect
});
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

## PostgreSQL

Install `pg` and follow the [adapter documentation](/database-adapters/pg) to setup your database.

```
npm install pg
```

```ts
// db.ts
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

export const pool = new Pool(/* ... */);

const dialect = new PostgresDialect({
	pool
});

export const db = new Kysely<Database>({
	dialect
});
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { pg } from "@lucia-auth/adapter-mysql";

import { pool } from "./db.js";

export const auth = lucia({
	adapter: pg(pool, tableNames)
});
```

## SQLite

Install `better-sqlite3` and follow the [adapter documentation](/database-adapters/better-sqlite3) to setup your database.

```
npm install better-sqlite3
```

```ts
// db.ts
import sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

export const sqliteDatabase = sqlite(/* ... */);

const dialect = new SqliteDialect({
	database: sqliteDatabase
});

export const db = new Kysely<Database>({
	dialect
});
```

```ts
// lucia.ts
import { lucia } from "lucia";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";

import { sqliteDatabase } from "./db.js";

const auth = lucia({
	adapter: betterSqlite3(sqliteDatabase, tableNames)
	// ...
});
```
