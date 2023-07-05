---
menuTitle: "Cloudflare D1"
title: "Cloudflare D1 adapter"
description: "Learn how to use Cloudflare D1 with Lucia"
---

Adapter for [Cloudflare D1](https://developers.cloudflare.com/d1) provided by the SQLite adapter package.

```ts
import { d1 } from "@lucia-auth/adapter-sqlite";
```

```ts
const d1: (
	database: D1Database,
	tableNames: {
		user: string;
		key: string;
		session: string;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

Table names are automatically escaped.

| name                 | type         | description           |
| -------------------- | ------------ | --------------------- |
| `database`           | `D1Database` | Cloudflare D1 binding |
| `tableNames.user`    | `string`     | User table name       |
| `tableNames.key`     | `string`     | Key table name        |
| `tableNames.session` | `string`     | Session table name    |

## Installation

```
npm i @lucia-auth/adapter-sqlite
pnpm add @lucia-auth/adapter-sqlite
yarn add @lucia-auth/adapter-sqlite
```

## Usage

```ts
import { lucia } from "lucia";
import { d1 } from "@lucia-auth/adapter-sqlite";

const initializeLucia = (db: D1Database) => {
	const auth = lucia({
		adapter: d1(db, {
			user: "user",
			key: "user_key",
			session: "user_session"
		})
		// ...
	});
	return auth;
};
```

## SQLite3 schema

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
