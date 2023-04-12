import { sqliteTable, text, integer, numeric } from "drizzle-orm/sqlite-core";

export const auth_user = sqliteTable("auth_user", {
	id: text("id").primaryKey().notNull()
});

export const auth_session = sqliteTable("auth_session", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => auth_user.id),
	activeExpires: integer("active_expires").notNull(),
	idleExpires: integer("idle_expires", { mode: "number" }).notNull()
});

export const auth_key = sqliteTable("auth_key", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id")
		.references(() => auth_user.id)
		.notNull(),
	primary_key: integer("primary_key", { mode: "number" }).notNull(),
	hashed_password: text("hashed_password"),
	expires: integer("expires", { mode: "number" })
});

export type SqliteAuthUserTable = typeof auth_user;
export type SqliteAuthSessionTable = typeof auth_session;
export type SqliteAuthKeyTable = typeof auth_key;
