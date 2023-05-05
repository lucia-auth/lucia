---
_order: 0
title: "Kysely"
description: "Learn how to use Kysely with Lucia"
---

[Kysely](https://github.com/kysely-org/kysely) is a type-safe and autocompletion-friendly typescript SQL query builder.

Lucia does not provide an adapter for Kysely itself, rather supporting the underling drivers instead.

## Supported dialects

| language   | dialects                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| MySQL      | [`mysql2`](https://github.com/sidorares/node-mysql2), [`@planetscale/database`](https://github.com/planetscale/database-js) |
| PostgreSQL | [`pg`](https://github.com/brianc/node-postgres)                                                                             |
| SQLite     | [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)                                                              |

## MySQL

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

Refer to the [MySQL](/adapters/mysql) page for the schema and other details.

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

### `@planetscale/database`

Requires a third party driver:

```
npm install @planetscale/database kysely-planetscale
pnpm add @planetscale/database kysely-planetscale
yarn add @planetscale/database kysely-planetscale
```

```ts
import { connect } from "@planetscale/database";
import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { lucia } from "lucia-auth";
import { planetscale } from "@lucia-auth/adapter-mysql";

const dbConfig = {
	host: "<host>",
	username: "<user>",
	password: "<password>"
};

// refer above for types
const db = new Kysely<DatabaseSchema>({
	dialect: new PlanetScaleDialect(dbConfig)
});

const auth = lucia({
	adapter: planetscale(connect(dbConfig))
	// ...
});
```

## PostgreSQL

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

Refer to the [PostgreSQL](/adapters/postgresql) page for the schema and other details.

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

Refer to the [SQLite](/adapters/sqlite) page for the schema and other details.

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
