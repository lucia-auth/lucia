---
menuTitle: "libSQL"
title: "libSQL adapter"
description: "Learn how to use libSQL with Lucia"
---

Adapter for [libSQL](https://github.com/libsql/libsql) provided by the SQLite adapter package.

```ts
import { libSQL } from "@lucia-auth/adapter-sqlite";
```

```ts
const libSQL: (
	client: Client,
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
| `client`             | `Client`         | Database client                                                           |
| `tableNames.user`    | `string`         | User table name                                                           |
| `tableNames.key`     | `string`         | Key table name                                                            |
| `tableNames.session` | `string \| null` | Session table name - can be `null` when using alongside a session adapter |

## Installation

```
npm i @lucia-auth/adapter-sqlite
pnpm add @lucia-auth/adapter-sqlite
yarn add @lucia-auth/adapter-sqlite
```

## Usage

```ts
import { lucia } from "lucia";
import { libsql } from "@lucia-auth/adapter-sqlite";
import { createClient } from "@libsql/client";

const db = createClient({
	url: "file:test/main.db"
});

const auth = lucia({
	adapter: libsql(db, {
		user: "user",
		key: "user_key",
		session: "user_session"
	})
	// ...
});
```

## libSQL schema

You can choose any table names, just make sure to define them in the adapter argument.

### User table

You can add additional columns to store user attributes.

```sql
CREATE TABLE user (
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
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### Session table

You can add additional columns to store session attributes. Make sure to update the foreign key statement if you change the user table name.

```sql
CREATE TABLE user_session (
    id VARCHAR(127) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```
