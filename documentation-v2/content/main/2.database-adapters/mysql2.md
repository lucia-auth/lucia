---
menuTitle: "`mysql2`"
title: "`mysql2` adapter"
description: "Learn how to use mysql2 with Lucia"
---

Adapter for [`mysql2`](https://github.com/sidorares/node-mysql) provided by the MySQL adapter package.

```ts
import { mysql2 } from "@lucia-auth/adapter-mysql";
```

```ts
const mysql2: (
	pool: Pool,
	tableNames: {
		user: string;
		key: string;
		session: string | null;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

Table names are automatically escaped.

| name                 | type             | description                                                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------- |
| `pool`               | `Pool`           | `mysql2` connection pool                                                  |
| `tableNames.user`    | `string`         | User table name                                                           |
| `tableNames.key`     | `string`         | Key table name                                                            |
| `tableNames.session` | `string \| null` | Session table name - can be `null` when using alongside a session adapter |

## Installation

```
npm i @lucia-auth/adapter-mysql@beta
pnpm add @lucia-auth/adapter-mysql@beta
yarn add @lucia-auth/adapter-mysql@beta
```

## Usage

```ts
import { lucia } from "lucia";
import { mysql2 } from "@lucia-auth/adapter-mysql";
import mysql from "mysql2/promise";

const connectionPool = mysql.createPool({
	// ...
});

const auth = lucia({
	adapter: mysql2(connectionPool, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})
	// ...
});
```

## MySQL schema

You can choose any table names, just make sure to define them in the adapter argument.

### User table

You can add additional columns to store user attributes.

```sql
CREATE TABLE auth_user (
    id VARCHAR(31) NOT NULL PRIMARY KEY
);
```

### Key table

Make sure to update the foreign key statement if you change the user table name.

```sql
CREATE TABLE user_key (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```

### Session table

You can add additional columns to store session attributes. Make sure to update the foreign key statement if you change the user table name.

```sql
CREATE TABLE user_session (
    id VARCHAR(127) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```
