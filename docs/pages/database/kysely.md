---
title: "Kysely"
---

# Kysely

Lucia doesn't provide an adapter for Kysely but does provide adapters for drivers supported by Kysely.

## MySQL

See the [MySQL](/database/mysql) page for the schema.

```ts
import { Lucia } from "lucia";
import { Mysql2Adapter } from "@lucia-auth/adapter-mysql";

import { createPool } from "mysql2/promise";
import { Kysely, MysqlDialect } from "kysely";

const pool = createPool();

const db = new Kysely<Database>({
	dialect: new MysqlDialect({
		pool: pool.pool // IMPORTANT NOT TO JUST PASS `pool`
	})
});

const adapter = new Mysql2Adapter(pool, tableNames);

interface Database {
	user: UserTable;
	session: SessionTable;
}

interface UserTable {
	id: string;
}

interface SessionTable {
	id: string;
	user_id: string;
	expires_at: Date;
}
```

## PostgreSQL

See the [PostgreSQL](/database/postgresql) page for the schema.

```ts
import { Lucia } from "lucia";
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";

import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const pool = new Pool();

const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool
	})
});

const adapter = new NodePostgresAdapter(pool, tableNames);

interface Database {
	user: UserTable;
	session: SessionTable;
}

interface UserTable {
	id: string;
}

interface SessionTable {
	id: string;
	user_id: string;
	expires_at: Date;
}
```

## SQLite

See the [SQLite](/database/sqlite) page for the schema.

```ts
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";

import sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const sqliteDatabase = sqlite();

export const db = new Kysely<Database>({
	dialect: new SqliteDialect({
		database: sqliteDatabase
	})
});

const adapter = new BetterSqlite3Adapter(sqliteDatabase, tableNames);

interface Database {
	user: UserTable;
	session: SessionTable;
}

interface UserTable {
	id: string;
}

interface SessionTable {
	id: string;
	user_id: string;
	expires_at: number;
}
```
