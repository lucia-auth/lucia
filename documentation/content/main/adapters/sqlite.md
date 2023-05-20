---
_order: 0
title: "SQLite"
description: "Learn how to use SQLite databases with Lucia"
---

An adapter for SQLite databases.

```
npm i @lucia-auth/adapter-sqlite
pnpm add @lucia-auth/adapter-sqlite
yarn add @lucia-auth/adapter-sqlite
```

You can alternatively use an ORM such as [Prisma](/adapters/prisma) with SQLite. Some drivers can be used with [Drizzle ORM](/adapters/drizzle) or [Kysely](/adapters/kysely) as well.

## `better-sqlite3`

```ts
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import sqlite from "better-sqlite3";

const db = sqlite("main.db");

const auth = lucia({
	adapter: betterSqlite3(db)
});
```

```ts
const betterSqlite3 = (db: Database) => () => Adapter;
```

#### Parameter

See [Database types](#database-types) for more information regarding the `Database` type used for the Kysely instance.

| name | type       | description     |
| ---- | ---------- | --------------- |
| db   | `Database` | SQLite instance |

## Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw:

- `SqliteError` for `better-sql3`.

## Database schema

#### `auth_user`

The length of the `VARCHAR` type of `id` should be of appropriate length if you generate your own user ids. You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type          | nullable | unique | identity |
| ---- | ------------- | :------: | :----: | :------: |
| id   | `VARCHAR(15)` |          |   ✓    |    ✓     |

```sql
CREATE TABLE auth_user (
    id VARCHAR(31) NOT NULL,
    PRIMARY KEY (id)
);
```

#### `auth_session`

Column type of `user_id` should match the type of `auth_user(id)`.

| name           | type           | foreign constraint | nullable | unique | identity |
| -------------- | -------------- | ------------------ | :------: | :----: | :------: |
| id             | `VARCHAR(127)` |                    |          |   ✓    |    ✓     |
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
| --------------- | -------------- | ------------------ | :------: | :----: | :------: |
| id              | `VARCHAR(255)` |                    |          |   ✓    |    ✓     |
| user_id         | `VARCHAR(15)`  | `auth_user(id)`    |          |        |          |
| primary_key     | `INT2`         |                    |          |        |          |
| hashed_password | `VARCHAR(255)` | true               |    ✓     |        |          |
| expires         | `BIGINT`       |                    |    ✓     |        |          |

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
