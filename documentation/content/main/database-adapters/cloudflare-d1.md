---
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
		session: string | null;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

Table names are automatically escaped.

| name                 | type             | description                                                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------- |
| `database`           | `D1Database`     | Cloudflare D1 binding                                                     |
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

Since the D1 bindings are only available in runtime, you'll need to create a new `Auth` instance on every request. Make sure to update your `Auth` type.

```ts
import { lucia } from "lucia";
import { d1 } from "@lucia-auth/adapter-sqlite";

export const initializeLucia = (db: D1Database) => {
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

export type Auth = ReturnType<typeof initializeLucia>;
```

Please see the [documentation for Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/) for accessing Cloudflare binding in your framework.

```ts
type Env = {
	DB: D1Database; // install `@cloudflare/workers-types`
};

export default {
	fetch: async (request: Request, env: Env) => {
		const auth = initializeLucia(env.DB);
		// ...
	}
};
```

## SQLite3 schema

You can choose any table names, just make sure to define them in the adapter argument. **The `id` columns are not UUID types with the default configuration.**

### User table

You can add additional columns to store user attributes.

```sql
CREATE TABLE user (
    id VARCHAR(15) NOT NULL PRIMARY KEY
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
