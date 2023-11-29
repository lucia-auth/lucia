---
layout: "@layouts/DocLayout.astro"
title: "PostgreSQL"
---

`@lucia-auth/adapter-postgresql` package provides adapters for PostgreSQL drivers:

- node-postgres (`pg`)
- Postgres.js (`postgres`)

```
npm install @lucia-auth/adapter-postgresql
```

## Schema

```sql
CREATE TABLE auth_user (
    id TEXT PRIMARY KEY
)

CREATE TABLE user_session (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id)
)
```

## Drivers

### node-postgres

`NodePostgresAdapter` takes a `Pool` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { NodePostgresAdapter } from "@lucia-auth/adapter-sqlite";
import pg from "pg";

const pool = new pg.Pool();

const lucia = new Lucia(
	new NodePostgresAdapter(pool, {
		user: "user",
		session: "session"
	})
);
```

### Postgres.js

`PostgresJsAdapter` takes a `Sql` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { PostgresJsAdapter } from "@lucia-auth/adapter-sqlite";
import postgres from "postgres";

const sql = postgres();

const lucia = new Lucia(
	new PostgresJsAdapter(sql, {
		user: "user",
		session: "session"
	})
);
```
