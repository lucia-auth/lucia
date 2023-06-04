---
_order: 0
title: "PlanetScale serverless"
description: "Learn how to use the PlanetScale serverless driver with Lucia"
---

There are few ways you can use Lucia with PlanetScale:

- [PlanetScale serverless driver adapter](/adapters/planetscale)
- [Prisma adapter](/adapters/prisma)
- Query builders such as [Drizzle](/adapters/drizzle) and [Kysely](/adapters/kysely) via one of the [MySQL adapters](/adapters/mysql)

The serverless driver allows you to query PlanetScale databases in a serverless environment, including the Edge runtime. This can also be used with the query builders mentioned above.

```ts
import { planetscale } from "@lucia-auth/adapter-mysql";
import { connect } from "@planetscale/database";

const connection = connect({
	host: "<host>",
	username: "<user>",
	password: "<password>"
});

const auth = lucia({
	adapter: planetscale(connection)
});
```

```ts
const planetscale = (connection: Connection) => () => Adapter;
```

#### Parameter

| name       | type         | description                   |
| ---------- | ------------ | ----------------------------- |
| connection | `Connection` | PlanetScale driver connection |

## Installation

The PlanetScale serverless adapter is provided as a part of the the MySQL adapter package.

```
npm i @lucia-auth/adapter-mysql
pnpm add @lucia-auth/adapter-mysql
yarn add @lucia-auth/adapter-mysql
```

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw a `DatabaseError`.

## Schema

Note: PlanetScale does not support foreign keys.

#### `auth_user`

The length of the `VARCHAR` type of `id` should be of appropriate length if you generate your own user ids. You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

| name | type          | nullable | unique | primary |
| ---- | ------------- | :------: | :----: | :-----: |
| id   | `VARCHAR(15)` |          |   ✓    |    ✓    |

```sql
CREATE TABLE auth_user (
    id VARCHAR(15) NOT NULL,
    PRIMARY KEY (id)
);
```

#### `auth_session`

| name           | type                | nullable | unique | identity |
| -------------- | ------------------- | :------: | :----: | :------: |
| id             | `VARCHAR(127)`      |          |   ✓    |    ✓     |
| user_id        | `VARCHAR(15)`       |          |        |          |
| active_expires | `BIGINT` (UNSIGNED) |          |        |          |
| idle_expires   | `BIGINT` (UNSIGNED) |          |        |          |

```sql
CREATE TABLE auth_session (
    id VARCHAR(127) NOT NULL,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id)
);
```

#### `auth_key`

| name            | type                 | nullable | unique | identity |
| --------------- | -------------------- | :------: | :----: | :------: |
| id              | `VARCHAR(255)`       |          |   ✓    |    ✓     |
| user_id         | `VARCHAR(15)`        |          |        |          |
| primary_key     | `TINYINT` (UNSIGNED) |          |        |          |
| hashed_password | `VARCHAR(255)`       |    ✓     |        |          |
| expires         | `BIGINT` (UNSIGNED)  |    ✓     |        |          |

```sql
CREATE TABLE auth_key (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(15) NOT NULL,
    primary_key TINYINT UNSIGNED NOT NULL,
    hashed_password VARCHAR(255),
    expires BIGINT UNSIGNED,
    PRIMARY KEY (id)
);
```
