---
order: 5
title: "Drizzle"
description: "Learn how to use Drizzle Orm with Lucia"
---

An Adapter for [drizzle-orm](https://github.com/drizzle-team/drizzle-orm). 

This adapter currently supports: 
- libsql
- bettersqlite3
- pg
- mysql2

## Installation 
```bash
npm i @lucia-auth/adapter-kysely
pnpm add @lucia-auth/adapter-kysely
yarn add @lucia-auth/adapter-kysely
```

## Errors
The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of these:

- `DatabaseError` for `pg`.
- `QueryError` for `mysql2`
- `SqliteError` for `better-sql3`
- `LibSqlError` for `@libsql/client`

## Usage
```ts 
import adapter from "@lucia-auth/adapter-drizzle"

const db = drizzle(options)

// copy from below
const auth_user = ...
const auth_key = ...
const auth_session = ...

const auth = lucia({
  adapter: adapter({
    db: db,
    auth_user, 
    auth_key, 
    auth_session, 
    type: "sqlite" // or "pg" or "mysql"
  })
})

```

## Schema Structure
### PostgreSQL
```ts
export const auth_user: AuthUserTable["pg"] = pgTable("auth_user", {
	id: text("id").primaryKey().notNull(),
  // add more user attributes here 
  // username: text("username").primaryKey().notNull()
});

export const auth_session = pgTable("auth_session", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id")
		.notNull()
		.references(() => auth_user.id),
	active_expires: bigint("active_expires", { mode: "number" }).notNull(),
	idle_expires: bigint("idle_expires", { mode: "number" }).notNull()
});

export const auth_key = pgTable("auth_key", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id")
		.references(() => auth_user.id)
		.notNull(),
	primary_key: boolean("primary_key").notNull(),
	hashed_password: text("hashed_password"),
	expires: bigint("expires", { mode: "number" })
});
```
### MySQL
```ts
export const auth_user = mysqlTable("auth_user", {
	id: varchar("id", { length: 15 }).primaryKey().notNull(),
  // add more user attributes here 
  // username: text("username").primaryKey().notNull()
});

export const auth_session = mysqlTable(
	"auth_session",
	{
		id: varchar("id", { length: 127 }).primaryKey().notNull(),
		user_id: varchar("user_id", { length: 15 })
			.notNull()
			.references(() => auth_user.id),
		active_expires: bigint("active_expires", { mode: "number" }).notNull(),
		idle_expires: bigint("idle_expires", { mode: "number" }).notNull()
	}
);

export const auth_key = mysqlTable("auth_key", {
	id: varchar("id", { length: 255 }).primaryKey().notNull(),
	user_id: varchar("user_id", { length: 15 })
		.references(() => auth_user.id)
		.notNull(),
	primary_key: boolean("primary_key").notNull(),
	hashed_password: text("hashed_password"),
	expires: bigint("expires", { mode: "number" })
});
```
### Sqlite
```ts
export const auth_user = sqliteTable("auth_user", {
	id: text("id").primaryKey().notNull(),
  // add more user attributes here 
  // username: text("username").primaryKey().notNull()
});

export const auth_session = sqliteTable(
	"auth_session",
	{
		id: text("id").primaryKey().notNull(),
		user_id: text("user_id")
			.notNull()
			.references(() => auth_user.id),
		active_expires: integer("active_expires").notNull(),
		idle_expires: integer("idle_expires", { mode: "number" }).notNull()
	}
);

export const auth_key = sqliteTable("auth_key", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id")
		.references(() => auth_user.id)
		.notNull(),
	primary_key: customType({
		dataType: () => "boolean",
		fromDriver: Boolean,
		toDriver: Number
	})("primary_key")
		.notNull()
		.$type<boolean>(),
	hashed_password: text("hashed_password"),
	expires: integer("expires", { mode: "number" })
});
```