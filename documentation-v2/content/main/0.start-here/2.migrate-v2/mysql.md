---
order: 0
title: "Update your MySQL database to Lucia v2"
---

Install the latest beta of the MySQL adapter package.

```
npm i @lucia-auth/adapter-mysql@beta
pnpm add @lucia-auth/adapter-mysql@beta
yarn add @lucia-auth/adapter-mysql@beta
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

Both the `mysql2` and PlanetScale serverless adapter now require you to define the table names. The example below is for the v1 schema, but you can of course rename your tables if you'd like.

```ts
import { lucia } from "lucia";
import { mysql2 } from "@lucia-auth/adapter-mysql";
import mysql from "mysql2/promise";

const connectionPool = mysql.createPool({
	// ...
});

lucia({
	adapter: mysql2(connectionPool, {
		user: "auth_user",
		key: "auth_key",
		session: "auth_session"
	})
	// ...
});
```

```ts
import { lucia } from "lucia";
import { planetscale } from "@lucia-auth/adapter-mysql";
import { connect } from "@planetscale/database";

const connection = connect({
	host: "<host>",
	username: "<user>",
	password: "<password>"
});

const auth = lucia({
	adapter: planetscale(connection, {
		user: "auth_user",
		key: "auth_key",
		session: "auth_session"
	})
	// ...
});
```
