---
layout: "@components/Layout.astro"
title: "PostgreSQL"
---

# PostgreSQL

`@lucia-auth/adapter-postgresql` package provides adapters for PostgreSQL drivers:

- node-postgres (`pg`)
- Postgres.js (`postgres`)

```
npm install @lucia-auth/adapter-postgresql@beta
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

`NodePostgresAdapter` takes a `Pool` or `Client` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { NodePostgresAdapter } from "@lucia-auth/adapter-sqlite";
import pg from "pg";

const pool = new pg.Pool();

const adapter = new NodePostgresAdapter(pool, {
	user: "auth_user",
	session: "user_session"
});
```

### Postgres.js

`PostgresJsAdapter` takes a `Sql` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { PostgresJsAdapter } from "@lucia-auth/adapter-sqlite";
import postgres from "postgres";

const sql = postgres();

const adapter = new PostgresJsAdapter(sql, {
	user: "auth_user",
	session: "user_session"
});
```
