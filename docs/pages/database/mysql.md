---
title: "MySQL"
---

# MySQL

`@lucia-auth/adapter-mysql` package provides adapters for MySQL drivers:

-   `mysql2`
-   PlanetScale serverless

```
npm install @lucia-auth/adapter-mysql
```

## Schema

You can change the `varchar` length as necessary. `session(id)` should be able to hold at least 40 chars.

User ID can be numeric (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```sql
CREATE TABLE user (
    id VARCHAR(255) PRIMARY KEY
)

CREATE TABLE user_session (
    id VARCHAR(255) PRIMARY KEY,
    expires_at DATETIME NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES user(id)
)
```

## Drivers

### `mysql2`

`Mysql2Adapter` takes a `Pool` or `Connection` instance from `mysql2/promises` and a list of table names.

```ts
import { Lucia } from "lucia";
import { Mysql2Adapter } from "@lucia-auth/adapter-mysql";
import mysql from "mysql2/promise";

const pool = mysql.createPool();

const adapter = new Mysql2Adapter(pool, {
	user: "user",
	session: "user_session"
});
```

### PlanetScale serverless

`PlanetScaleAdapter` takes a `Client` or `Connection` instance and a list of table names.

```ts
import { Lucia } from "lucia";
import { PlanetScaleAdapter } from "@lucia-auth/adapter-mysql";
import { Client } from "@planetscale/database";

const client = new Client();

const adapter = new PlanetScaleAdapter(client, {
	user: "user",
	session: "user_session"
});
```
