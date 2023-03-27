auth\_---
\_order: 0
title: "Kysely"
description: "Learn how to use Kysely with Lucia"

---

An adapter for [Kysely SQL query builder](https://github.com/koskimas/kysely). This adapter currently supports [all 3 dialects officially supported by Kysely](https://github.com/koskimas/kysely#installation):

- PostgreSQL via [`pg`](https://github.com/brianc/node-postgres)
- MySQL via [`mysql2`](https://github.com/sidorares/node-mysql2)
- SQLite via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)

```ts
const adapter: (
	db: Kysely<Database>,
	dialect: "pg" | "mysql" | "better-sqlite3"
) => () => Adapter;
```

### Parameter

See [Database types](#database-types) for more information regarding the `Database` type used for the Kysely instance.

| name    | type                                  | description     |
| ------- | ------------------------------------- | --------------- |
| db      | `Kysely<Database>`                    | Kysely instance |
| dialect | `"pg" \| "mysql" \| "better-sqlite3"` | dialect used    |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of these:

- `DatabaseError` for `pg`.
- `QueryError` for `mysql2`
- `SqliteError` for `better-sql3`

## Installation

```bash
npm i @lucia-auth/adapter-kysely
pnpm add @lucia-auth/adapter-kysely
yarn add @lucia-auth/adapter-kysely
```

## Usage

```ts
import {
	default as kysely,
	type KyselyLuciaDatabase
} from "@lucia-auth/adapter-kysely";
import { Kysely } from "kysely";

const db = new Kysely<KyselyLuciaDatabase>(options);

const auth = lucia({
	adapter: kysely(db, "pg") // change "pg" to "mysql2", "better-sqlite3"
});
```

### Database types

Define types for each table in your database or generate them automatically using [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen). Then, pass those types to the `Kysely` constructor. See the [Kysely github repo](https://github.com/koskimas/kysely#minimal-example) for an example on creating the `Kysely` instance.

The `Database` type must be of the following structure.

```ts
import { ColumnType, Generated } from "kysely";

type BigIntColumnType = ColumnType<number | bigint>;

type Session = {
	expires: BigIntColumnType;
	id: string;
	idle_expires: BigIntColumnType;
	user_id: string;
};

type User = {
	id: Generated<string>;
	// Plus other columns that you defined
};

export type Key = {
	id: string;
	hashed_password: string | null;
	user_id: string;
	primary_key: number; // boolean for Postgres
	expires: BigIntColumnType | null;
};

type Database = {
	auth_session: Session;
	auth_user: User;
	auth_key: Key;
	// Plus other tables
};
```

You can also import the types from `adapter-kysely` and extend them.

```ts
import type {
	KyselyLuciaDatabase,
	KyselyUser
} from "@lucia-auth/adapter-kysely";

// Add a column for username in your user table
type User = {
	username: string;
} & KyselyUser;

type Database = Omit<KyselyLuciaDatabase, "auth_user"> & {
	auth_user: User;
	other_table: {
		//...
	};
};

const db = new Kysely<Database>(options);

const auth = lucia({
	adapter: kysely(db, dialect)
});
```

## Database structure

### PostgreSQL

#### `auth_user`

You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type   | foreign constraint | nullable | unique | primary |
| ---- | ------ | ------------------ | -------- | ------ | ------- |
| id   | `TEXT` |                    |          | true   | true    |

```sql
CREATE TABLE auth_user (
    id TEXT PRIMARY KEY
);
```

#### `auth_session`

| name           | type     | foreign constraint | nullable | unique | primary |
| -------------- | -------- | ------------------ | -------- | ------ | ------- |
| id             | `TEXT`   |                    |          | true   | true    |
| user_id        | `TEXT`   | `auth_user(id)`    |          |        |         |
| active_expires | `BIGINT` |                    |          |        |         |
| idle_expires   | `BIGINT` |                    |          |        |         |

```sql
CREATE TABLE auth_session (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth_user(id) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL
);
```

#### `auth_key`

| name            | type      | foreign constraint | nullable | unique | primary |
| --------------- | --------- | ------------------ | -------- | ------ | ------- |
| id              | `TEXT`    |                    |          | true   | true    |
| user_id         | `TEXT`    | `auth_user(id)`    |          |        |         |
| primary_key     | `BOOLEAN` |                    |          |        |         |
| hashed_password | `TEXT`    |                    | true     |        |         |
| expires         | `BIGINT`  |                    | true     |        |         |

```sql
CREATE TABLE auth_key (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth_user(id) NOT NULL,
    primary_key BOOLEAN NOT NULL,
    hashed_password TEXT,
    expires BIGINT
);
```

### MySQL

#### `auth_user`

The length of the `VARCHAR` type of `id` should be of appropriate length if you generate your own user ids. You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type          | nullable | unique | primary |
| ---- | ------------- | -------- | ------ | ------- |
| id   | `VARCHAR(15)` |          | true   | true    |

```sql
CREATE TABLE user (
    id VARCHAR(15) NOT NULL,
    PRIMARY KEY (id)
);
```

#### `auth_session`

| name           | type                | foreign constraint | nullable | unique | identity |
| -------------- | ------------------- | ------------------ | -------- | ------ | -------- |
| id             | `VARCHAR(127)`      |                    |          | true   | true     |
| user_id        | `VARCHAR(15)`       | `auth_user(id)`    |          |        |          |
| active_expires | `BIGINT` (UNSIGNED) |                    |          |        |          |
| idle_expires   | `BIGINT` (UNSIGNED) |                    |          |        |          |

```sql
CREATE TABLE session (
    id VARCHAR(127) NOT NULL,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```

#### `auth_key`

| name            | type                 | foreign constraint | nullable | unique | identity |
| --------------- | -------------------- | ------------------ | -------- | ------ | -------- |
| id              | `VARCHAR(255)`       |                    |          | true   | true     |
| user_id         | `VARCHAR(15)`        | `auth_user(id)`    |          |        |          |
| primary_key     | `TINYINT` (UNSIGNED) |                    |          |        |          |
| hashed_password | `VARCHAR(255)`       |                    | true     |        |          |
| expires         | `BIGINT` (UNSIGNED)  |                    | true     |        |          |

```sql
CREATE TABLE `auth_key` (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(15) NOT NULL,
    primary_key TINYINT UNSIGNED NOT NULL,
    hashed_password VARCHAR(255),
    expires BIGINT UNSIGNED,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```

### SQLite

#### `auth_user`

The length of the `VARCHAR` type of `id` should be of appropriate length if you generate your own user ids. You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type          | nullable | unique | identity |
| ---- | ------------- | -------- | ------ | -------- |
| id   | `VARCHAR(15)` |          | true   | true     |

```sql
CREATE TABLE auth_user (
    id VARCHAR(31) NOT NULL,
    PRIMARY KEY (id)
);
```

#### `auth_session`

Column type of `user_id` should match the type of `auth_user(id)`.

| name           | type           | foreign constraint | nullable | unique | identity |
| -------------- | -------------- | ------------------ | -------- | ------ | -------- |
| id             | `VARCHAR(127)` |                    |          | true   | true     |
| user_id        | `VARCHAR(15)`  | `auth_user(id)`    |          |        |          |
| active_expires | `BIGINT`       |                    |          |        |          |
| idle_expires   | `BIGINT`       |                    |          |        |          |

```sql
CREATE TABLE auth_session (
    id VARCHAR(127) NOT NULL,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```

#### `auth_key`

Column type of `user_id` should match the type of `user(id)`.

| name            | type           | foreign constraint | nullable | unique | identity |
| --------------- | -------------- | ------------------ | -------- | ------ | -------- |
| id              | `VARCHAR(255)` |                    |          | true   | true     |
| user_id         | `VARCHAR(15)`  | `auth_user(id)`    |          |        |          |
| primary_key     | `INT2`         |                    |          |        |          |
| hashed_password | `VARCHAR(255)` | true               | true     |        |          |
| expires         | `BIGINT`       |                    | true     |        |          |

```sql
CREATE TABLE auth_key (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
    primary_key INT2 NOT NULL,
    expires BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```
