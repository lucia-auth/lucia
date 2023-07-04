---
order: 0
title: "Update your PostgreSQL database to Lucia v2"
---

Install the latest beta of the PostgreSQL adapter package.

```
npm i @lucia-auth/adapter-postgresql@beta
pnpm add @lucia-auth/adapter-postgresql@beta
yarn add @lucia-auth/adapter-postgresql@beta
```

## Update database

### Remove single use keys

```sql
DELETE FROM auth_key
WHERE expires != null;
```

### Update `auth_key` schema

Remove columns `auth_key(primary_key)` and `auth_key(expires)`.

```sql
ALTER TABLE auth_key
DROP COLUMN primary_key;

ALTER TABLE auth_key
DROP COLUMN expires;
```

## Initialize

The `pg` adapter now requires you to define the table names. The example below is for the v1 schema, but you can of course rename your tables if you'd like.

```ts
import { lucia } from "lucia";
import { pg } from "@lucia-auth/adapter-postgresql";
import postgres from "pg";

const pool = new postgres.Pool({
	connectionString: CONNECTION_URL
});

lucia({
	adapter: pg(pool, {
		user: "auth_user",
		key: "auth_key",
		session: "auth_session"
	})
	// ...
});
```
