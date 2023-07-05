---
order: 0
title: "Update your SQLite database to Lucia v2"
---

Install the latest beta of the SQLite adapter package.

```
npm i @lucia-auth/adapter-sqlite@beta
pnpm add @lucia-auth/adapter-sqlite@beta
yarn add @lucia-auth/adapter-sqlite@beta
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

Both the `better-sqlite3` and Cloudflare D1 adapter now require you to define the table names. The example below is for the v1 schema, but you can of course rename your tables if you'd like.

```ts
import { lucia } from "lucia";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import sqlite from "better-sqlite3";

const db = sqlite("main.db");

lucia({
	adapter: betterSqlite3(db, {
		user: "auth_user",
		key: "auth_key",
		session: "auth_session"
	})
	// ...
});
```

```ts
import { lucia } from "lucia";
import { d1 } from "@lucia-auth/adapter-sqlite";

lucia({
	adapter: d1(db, {
		user: "auth_user",
		key: "auth_key",
		session: "auth_session"
	})
	// ...
});
//
```
