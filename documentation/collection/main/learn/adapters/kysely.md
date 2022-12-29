---
_order: 0
title: "Kysely"
---

An adapter for [Kysely SQL query builder](https://github.com/koskimas/kysely). This adapter currently only supports PostgreSQL.

```ts
const adapter: (
	db: Kysely<DB>
) => AdapterFunction<Adapter>;
```

### Parameter

See [Database interfaces](#database-interfaces) for more information regarding the DB type used for the Kysely instance.

| name        | type         | description     | optional |
| ----------- | ------------ | --------------- | -------- |
| db          | `Kysely<DB>` | Kysely instance |          |

### Errors

The adapter and Lucia will not not handle [unknown errors](/learn/basics/error-handling#known-errors), database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw a `DatabaseError` from `pg`.

## Installation

```bash
npm i @lucia-auth/adapter-kysely
pnpm add @lucia-auth/adapter-kysely
yarn add @lucia-auth/adapter-kysely
```

## Usage

```ts
import kysely from "@lucia-auth/adapter-kysely";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB } from "dbTypes"; // Your types for your database

const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: DATABASE_URL
		})
	})
});

const auth = lucia({
	adapter: kysely(db)
});
```

### Database interfaces

Define interfaces for each table in your database or generate them automatically using [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen). Then, pass those interfaces to the `Kysely` constructor. See the [Kysely github repo](https://github.com/koskimas/kysely#minimal-example) for an example on creating the `Kysely` instance.

The `DB` interface must be of the following structure.

```ts
import { ColumnType, Generated } from "kysely";

type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

interface Session {
	expires: Int8;
	id: string;
	idle_expires: Int8;
	user_id: string;
}

interface User {
	hashed_password: string | null;
	id: Generated<string>;
	provider_id: string;
	// Plus other columns that you defined
}

interface DB {
	session: Session;
	user: User;
	// Plus other table interfaces
}
```

You can also import the interfaces from `adapter-kysely` and extend them.

```ts
import type { DB, User } from "@lucia-auth/adapter-kysely/dbTypes";

// Add a column for username in your user table
interface UserExt extends User {
	username: string;
}

// Create interfaces for your other tables
interface Home {
	id: number;
	user_id: string;
}

interface DBExt extends Omit<DB, "user"> {
	user: UserExt;
	home: Home;
}

const db = new Kysely<DBExt>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.DATABASE_URL
		})
	})
});

const auth = lucia({
	adapter: kysely(db)
});
```

## Database structure

`uuid` should be changed to `text` if you use custom user ids.

### `user`

You may add additional columns to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes). `id` may be `text` if you generate your own user id.

| name            | type   | foreign constraint | default             | nullable | unique | identity |
| --------------- | ------ | ------------------ | ------------------- | -------- | ------ | -------- |
| id              | `uuid` |                    | `gen_random_uuid()` |          | true   | true     |
| provider_id     | `text` |                    |                     |          | true   |          |
| hashed_password | `text` |                    |                     | true     |        |          |

### `session`

| name         | type   | foreign constraint | nullable | unique | identity |
| ------------ | ------ | ------------------ | -------- | ------ | -------- |
| id           | `text` |                    |          | true   | true     |
| user_id      | `uuid` | `public.user(id)`  |          |        |          |
| expires      | `int8` |                    |          |        |          |
| idle_expires | `int8` |                    |          |        |          |

## Create table statements

You may add additional columns to store custom user data in `user` table. Refer to [Store user attributes](/learn/basics/store-user-attributes).

```sql
CREATE TABLE public.user (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	provider_id TEXT NOT NULL UNIQUE,
	hashed_password TEXT
);

CREATE TABLE public.session (
  	id TEXT PRIMARY KEY,
	user_id UUID REFERENCES public.user(id) NOT NULL,
	expires INT8 NOT NULL,
	idle_expires INT8 NOT NULL
);
```
