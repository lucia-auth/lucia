import {
	sqliteTable,
	text,
	integer,
	customType
} from "drizzle-orm/sqlite-core";
import { AuthKeyTable, AuthSessionTable, AuthUserTable } from "../types";

export const auth_user: AuthUserTable["sqlite"] = sqliteTable("auth_user", {
	id: text("id").primaryKey().notNull()
});

export const auth_session: AuthSessionTable["sqlite"] = sqliteTable(
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

export const auth_key: AuthKeyTable["sqlite"] = sqliteTable("auth_key", {
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
