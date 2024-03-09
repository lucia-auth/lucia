---
title: "PostgreSQL"
---

# PostgreSQL

> If you use Drizzle ORM in your project, use the [Drizzle adapter](https://lucia-auth.com/database/drizzle#postgresql) instead as Drizzle ORM overrides how your database driver handles dates.

`@lucia-auth/adapter-postgresql` package provides adapters for PostgreSQL drivers:

-   Neon HTTP serverless driver (`@neondatabase/serverless`)
-   node-postgres (`pg`)
-   Postgres.js (`postgres`)

```
npm install @lucia-auth/adapter-postgresql
```

## Schema

User ID can be numeric (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```sql
CREATE TABLE auth_user (
    id TEXT PRIMARY KEY
)

CREATE TABLE user_session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_user(id)
)
```

## Drivers

### Neon HTTP serverless driver

`NeonHTTPAdapter` takes a `NeonQueryFunction` and a list of table names. Supports both `fullResults` configuration. Use the node-postgres adapter for the WebSocket driver.

```ts
import { Lucia } from "lucia";
import { NeonHTTPAdapter } from "@lucia-auth/adapter-postgresql";
import { neon } from "@neondatabase/serverless";

const sql = neon();

const adapter = new NeonHTTPAdapter(sql, {
	user: "auth_user",
	session: "user_session"
});
```

### node-postgres

`NodePostgresAdapter` takes a `Pool` or `Client` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";
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
import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql";
import postgres from "postgres";

const sql = postgres();

const adapter = new PostgresJsAdapter(sql, {
	user: "auth_user",
	session: "user_session"
});
```
