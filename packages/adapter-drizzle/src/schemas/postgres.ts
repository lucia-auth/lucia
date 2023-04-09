import { bigint, boolean, pgTable, text } from "drizzle-orm/pg-core";

export const auth_user = pgTable("auth_user", {
	id: text("id").primaryKey().notNull()
});

export const auth_session = pgTable("auth_session", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => auth_user.id),
	activeExpires: bigint("active_expires", { mode: "number" }).notNull(),
	idleExpires: bigint("idle_expires", { mode: "number" }).notNull()
});

export const auth_key = pgTable("auth_key", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id")
		.references(() => auth_user.id)
		.notNull(),
	primaryKey: boolean("primary_key").notNull(),
	hashedPassword: text("hashed_password"),
	expires: bigint("expires", { mode: "bigint" })
});
