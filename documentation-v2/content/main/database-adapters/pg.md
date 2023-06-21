---
order: 0
title: "pg"
description: "Learn how to use pg with Lucia"
format: "code"
---

Adapter for [`pg`](https://github.com/brianc/node-postgres) provided by the PostgreSQL adapter package.

```ts
import { pg } from "@lucia-auth/adapter-postgresql";
```

```ts
const pg: (
	pool: Pool,
	tableNames: {
		user: string;
		key: string;
		session: string;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

Table names are automatically escaped.

| name                 | type     | description          |
| -------------------- | -------- | -------------------- |
| `pool`               | `Pool`   | `pg` connection pool |
| `tableNames.user`    | `string` | User table name      |
| `tableNames.key`     | `string` | Key table name       |
| `tableNames.session` | `string` | Session table name   |

## Installation

```
npm i @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

## Usage

```ts
import { lucia } from "lucia";
import { pg } from "@lucia-auth/adapter-postgresql";
import postgres from "pg";

const pool = new postgres.Pool({
	connectionString: CONNECTION_URL
});

const auth = lucia({
	adapter: pg(pool, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})
	// ...
});
```

## PostgreSQL schema

You can choose any table names, just make sure to define them in the adapter argument.

### User table

You can add additional columns to store user attributes.

```sql
CREATE TABLE auth_user (
    id TEXT NOT NULL PRIMARY KEY,
);
```

### Key table

Make sure to update the foreign key statement if you change the user table name.

```sql
CREATE TABLE user_key (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth_user(id),
    hashed_password TEXT,
);
```

### Session table

You can add additional columns to store session attributes. Make sure to update the foreign key statement if you change the user table name.

```sql
CREATE TABLE user_session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth_user(id),
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
);
```
