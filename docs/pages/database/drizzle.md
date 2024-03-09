---
title: "Drizzle ORM"
---

# Drizzle ORM

Adapters for Drizzle ORM are provided by `@lucia-auth/adapter-drizzle`. Supports MySQL, PostgreSQL, and SQLite. You're free to rename the underlying table and column names as long as the field names are the same (e.g. `expiresAt`).

```
npm install @lucia-auth/adapter-drizzle
```

## MySQL

`DrizzleMySQLAdapter` takes a `Database` instance, the session table, and the user table. You can change the `varchar` length. `session(id)` should be able to hold at least 40 chars.

User ID can be numeric (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```ts
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";

import mysql from "mysql2/promise";
import { mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";

const connection = await mysql.createConnection();
const db = drizzle(connection);

const userTable = mysqlTable("user", {
	id: varchar("id", {
		length: 255
	}).primaryKey()
});

const sessionTable = mysqlTable("session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 255
	})
		.notNull()
		.references(() => userTable.id),
	expiresAt: datetime("expires_at").notNull()
});

const adapter = new DrizzleMySQLAdapter(db, sessionTable, userTable);
```

## PostgreSQL

`DrizzlePostgreSQLAdapter` takes a `Database` instance, the session table, and the user table.

User ID can be numeric (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```ts
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";

import pg from "pg";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new pg.Pool();
const db = drizzle(pool);

const userTable = pgTable("user", {
	id: text("id").primaryKey()
});

const sessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull()
});

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);
```

## SQLite

`DrizzleSQLiteAdapter` takes a `Database` instance, the session table, and the user table.

User ID can be numeric (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```ts
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";

import sqlite from "better-sqlite3";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqliteDB = sqlite(":memory:");
const db = drizzle(sqliteDB);

const userTable = sqliteTable("user", {
	id: text("id").notNull().primaryKey()
});

const sessionTable = sqliteTable("session", {
	id: text("id").notNull().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer("expires_at").notNull()
});

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
```
