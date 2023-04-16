import {
	bigint,
	boolean,
	mysqlTable,
	text,
	varchar
} from "drizzle-orm/mysql-core";
import { AuthKeyTable, AuthSessionTable, AuthUserTable } from "../types";

export const auth_user: AuthUserTable["mysql"] = mysqlTable("auth_user", {
	id: varchar("id", { length: 15 }).primaryKey().notNull()
});

export const auth_session: AuthSessionTable["mysql"] = mysqlTable(
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

export const auth_key: AuthKeyTable["mysql"] = mysqlTable("auth_key", {
	id: varchar("id", { length: 255 }).primaryKey().notNull(),
	user_id: varchar("user_id", { length: 15 })
		.references(() => auth_user.id)
		.notNull(),
	primary_key: boolean("primary_key").notNull(),
	hashed_password: text("hashed_password"),
	expires: bigint("expires", { mode: "number" })
});
