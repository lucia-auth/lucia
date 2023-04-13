import { bigint, boolean, pgTable, text } from "drizzle-orm/pg-core";
import { AuthKeyTable, AuthSessionTable, AuthUserTable } from "../types";

export const auth_user: AuthUserTable["pg"] = pgTable("auth_user", {
	id: text("id").primaryKey().notNull()
});

export const auth_session: AuthSessionTable["pg"] = pgTable("auth_session", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id")
		.notNull()
		.references(() => auth_user.id),
	active_expires: bigint("active_expires", { mode: "number" }).notNull(),
	idle_expires: bigint("idle_expires", { mode: "number" }).notNull()
});

export const auth_key: AuthKeyTable["pg"] = pgTable("auth_key", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id")
		.references(() => auth_user.id)
		.notNull(),
	primary_key: boolean("primary_key").notNull(),
	hashed_password: text("hashed_password"),
	expires: bigint("expires", { mode: "number" })
});
