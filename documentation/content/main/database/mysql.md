---
_order: 0
title: "MySQL"
description: "Learn how to use MySQL databases with Lucia"
---

An adapter for MySQL databases.

```bash
npm i @lucia-auth/adapter-mysql
pnpm add @lucia-auth/adapter-mysql
yarn add @lucia-auth/adapter-mysql
```

You can alternatively use an ORM such as [Prisma](/database/prisma) with MySQl.

## Supported drivers

Some drivers can be used with [Drizzle ORM](/database/drizzle) or [Kysely](/database/kysely).

### `mysql2`

Supports [`mysql2`](https://www.npmjs.com/package/mysql2) version 3.0.0 or greater. This adapter does **NOT** handle `boolean` => `number` conversion.

```ts
import { mysql2 } from "@lucia-auth/adapter-mysql";
import mysql from "mysql2/promise";

const poolConnection = mysql.createPool({
	// ...
});

const auth = lucia({
	adapter: mysql2(poolConnection)
});
```

#### Parameter

| name | type   | description |
| ---- | ------ | ----------- |
| pool | `Pool` | MySQL pool  |

## Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw:

- `QueryError` for `mysql2`.

## Database schema

#### `auth_user`

The length of the `VARCHAR` type of `id` should be of appropriate length if you generate your own user ids. You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type          | nullable | unique | primary |
| ---- | ------------- | :------: | :----: | :-----: |
| id   | `VARCHAR(15)` |          |   ✓    |    ✓    |

```sql
CREATE TABLE user (
    id VARCHAR(15) NOT NULL,
    PRIMARY KEY (id)
);
```

#### `auth_session`

| name           | type                | foreign constraint | nullable | unique | identity |
| -------------- | ------------------- | ------------------ | :------: | :----: | :------: |
| id             | `VARCHAR(127)`      |                    |          |   ✓    |    ✓     |
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
| --------------- | -------------------- | ------------------ | :------: | :----: | :------: |
| id              | `VARCHAR(255)`       |                    |          |   ✓    |    ✓     |
| user_id         | `VARCHAR(15)`        | `auth_user(id)`    |          |        |          |
| primary_key     | `TINYINT` (UNSIGNED) |                    |          |        |          |
| hashed_password | `VARCHAR(255)`       |                    |    ✓     |        |          |
| expires         | `BIGINT` (UNSIGNED)  |                    |    ✓     |        |          |

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
