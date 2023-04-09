import { bigint, boolean, mysqlTable, text } from "drizzle-orm/mysql-core";

export const auth_user = mysqlTable("auth_user", {
	id: text("id").primaryKey().notNull()
});

export const auth_session = mysqlTable("auth_session", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => auth_user.id),
	activeExpires: bigint("active_expires", { mode: "number" }).notNull(),
	idleExpires: bigint("idle_expires", { mode: "number" }).notNull()
});

export const auth_key = mysqlTable("auth_key", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id")
		.references(() => auth_user.id)
		.notNull(),
	primaryKey: boolean("primary_key").notNull(),
	hashedPassword: text("hashed_password"),
	expires: bigint("expires", { mode: "bigint" })
});

export type MysqlAuthUserTable = typeof auth_user;
export type MysqlAuthSessionTable = typeof auth_session;
export type MysqlAuthKeyTable = typeof auth_key;
