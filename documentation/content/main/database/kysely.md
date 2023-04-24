---
_order: 0
title: "Kysely"
description: "Learn how to use Kysely with Lucia"
---

[Kysely](https://github.com/kysely-org/kysely) is a type-safe and autocompletion-friendly typescript SQL query builder.

Lucia does not provide an adapter for Kysely itself, rather supporting the underling drivers instead.

## Supported dialects

| language   | dialects                                                       |
| ---------- | -------------------------------------------------------------- |
| MySQL      | [`mysql2`](https://github.com/sidorares/node-mysql2)           |
| PostgreSQL | [`pg`](https://github.com/brianc/node-postgres)                |
| SQLite     | [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) |

## MySQL

Use [the MySQL adapter](/database/mysql).

```ts
type DatabaseSchema = <{
	auth_user: {
		id: string;
		// other fields
	};
	auth_session: {
		active_expires: bigint | number;
		id: string;
		idle_expires: bigint | number;
		user_id: string;
	};
	auth_key: {
		id: string;
		hashed_password: string | null;
		user_id: string;
		primary_key: number;
		expires: bigint | number | null;
	};
}>
```

### `mysql2`

Refer to the [`mysql2`](/database/mysql#mysql2) section.

```ts
import mysql from "mysql2/promise";
import { Kysely, MysqlDialect } from "kysely";
import lucia from "lucia-auth";
import { mysql2 } from "@lucia-auth/adapter-mysql";

const connectionPool = mysql.createPool({
	// ...
});

// refer above for types
const db = new Kysely<DatabaseSchema>({
	dialect: new MysqlDialect({
		pool: connectionPool
	})
});

const auth = lucia({
	adapter: mysql2(connectionPool)
	// ...
});
```

## PostgreSQL

Use [the PostgreSQL adapter](/database/postgresql).

```ts
type DatabaseSchema = <{
	auth_user: {
		id: string;
		// other fields
	};
	auth_session: {
		active_expires: bigint | number;
		id: string;
		idle_expires: bigint | number;
		user_id: string;
	};
	auth_key: {
		id: string;
		hashed_password: string | null;
		user_id: string;
		primary_key: boolean;
		expires: bigint | number | null;
	};
}>
```

### `pg`

Refer to the [`pg`](/database/postgresql#pg) section.

```ts
import postgres from "pg";
import { Kysely, PostgresDialect } from "kysely";
import lucia from "lucia-auth";
import { pg } from "@lucia-auth/adapter-postgresql";

const connectionPool = new postgres.Pool({
	// ...
});

// refer above for types
const db = new Kysely<DatabaseSchema>({
	dialect: new PostgresDialect({
		pool: connectionPool
	})
});

const auth = lucia({
	adapter: pg(connectionPool)
	// ...
});
```

## SQLite

Use [the SQLite adapter](/database/sqlite).

```ts
type DatabaseSchema = <{
	auth_user: {
		id: string;
		// other fields
	};
	auth_session: {
		active_expires: bigint | number;
		id: string;
		idle_expires: bigint | number;
		user_id: string;
	};
	auth_key: {
		id: string;
		hashed_password: string | null;
		user_id: string;
		primary_key: number;
		expires: bigint | number | null;
	};
}>
```

### `better-sqlite3`

Refer to the [`better-sqlite3`](/database/sqlite#better-sqlite3) section.

```ts
import sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import lucia from "lucia-auth";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";

const database = sqlite(pathToDbFile);

// refer above for types
const db = new Kysely<DatabaseSchema>({
	dialect: new SqliteDialect({
		database
	})
});

const auth = lucia({
	adapter: betterSqlite3(database)
	// ...
});
```
