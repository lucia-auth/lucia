---
_order: 0
title: "PostgreSQL"
description: "Learn how to use PostgreSQL databases with Lucia"
---

An adapter for PostgreSQL databases.

```
npm i @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

You can alternatively use an ORM such as [Prisma](/adapters/prisma) with PostgreSQL. Some drivers can be used with [Drizzle ORM](/adapters/drizzle) or [Kysely](/adapters/kysely) as well.

## `pg`

Supports [`pg`](https://www.npmjs.com/package/pg) version 8.0.0 or greater.

```ts
import { pg } from "@lucia-auth/adapter-postgresql";
import postgres from "pg";

const pool = new postgres.Pool({
	connectionString: CONNECTION_URL
});

const auth = lucia({
	adapter: pg(pool)
});
```

```ts
const pg = (pool: Pool) => () => Adapter;
```

#### Parameter

| name | type   | description     |
| ---- | ------ | --------------- |
| pool | `Pool` | PostgreSQL pool |

## Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw:

- `DatabaseError` for `pg`.

## Database schema

#### `auth_user`

You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type   | foreign constraint | nullable | unique | primary |
| ---- | ------ | ------------------ | :------: | :----: | :-----: |
| id   | `TEXT` |                    |          |   ✓    |    ✓    |

```sql
CREATE TABLE auth_user (
    id TEXT PRIMARY KEY
);
```

#### `auth_session`

| name           | type     | foreign constraint | nullable | unique | primary |
| -------------- | -------- | ------------------ | :------: | :----: | :-----: |
| id             | `TEXT`   |                    |          |   ✓    |    ✓    |
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
| --------------- | --------- | ------------------ | :------: | :----: | :-----: |
| id              | `TEXT`    |                    |          |   ✓    |    ✓    |
| user_id         | `TEXT`    | `auth_user(id)`    |          |        |         |
| primary_key     | `BOOLEAN` |                    |          |        |         |
| hashed_password | `TEXT`    |                    |    ✓     |        |         |
| expires         | `BIGINT`  |                    |    ✓     |        |         |

```sql
CREATE TABLE auth_key (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth_user(id) NOT NULL,
    primary_key BOOLEAN NOT NULL,
    hashed_password TEXT,
    expires BIGINT
);
```
