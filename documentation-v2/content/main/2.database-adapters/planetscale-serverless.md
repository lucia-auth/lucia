---
menuTitle: "PlanetScale serverless"
title: "PlanetScale serverless adapter"
description: "Learn how to use the PlanetScale serverless driver with Lucia"
---

Adapter for [PlanetScale serverless driver](https://github.com/planetscale/database-js) provided by the MySQL adapter package.

```ts
import { planetscale } from "@lucia-auth/adapter-mysql";
```

```ts
const planetscale: (
	connection: Connection,
	tableNames: {
		user: string;
		key: string;
		session: string | nul;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

Table names are automatically escaped.

| name                 | type             | description                                                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------- |
| `connection`         | `Connection`     | PlanetScale serverless driver connection                                  |
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
    id VARCHAR(31) NOT NULL PRIMARY KEY,
);
```

### Key table

```sql
CREATE TABLE user_key (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
);
```

### Session table

You can add additional columns to store session attributes.

```sql
CREATE TABLE user_session (
    id VARCHAR(127) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
);
```
