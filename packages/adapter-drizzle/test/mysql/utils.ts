import { mysqlTable, text } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";
import { auth_key, auth_session } from "../../src/mysql/schema";
import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import adapter from "../../src";
import { LuciaError } from "lucia-auth";

export const auth_user = mysqlTable("auth_user", {
	id: text("id").primaryKey().notNull(),
	username: text("username").notNull()
});

export function getQueryHandler(db: MySql2Database) {
	return {
		user: {
			async clear() {
				await db.delete(auth_user).execute();
			},
			async get() {
				return db.select().from(auth_user).execute();
			},
			async insert(user) {
				await db
					.insert(auth_user)
					.values({
						id: user.id,
						username: user.username
					})
					.execute();
			}
		},
		key: {
			async clear() {
				await db.delete(auth_key).execute();
			},
			async get() {
				return db.select().from(auth_key).execute();
			},
			async insert(key) {
				await db.insert(auth_key).values(key).execute();
			}
		},
		session: {
			async clear() {
				await db.delete(auth_session).execute();
			},
			async get() {
				return db.select().from(auth_session).execute();
			},
			async insert(session) {
				const _session = {
					...session,
					active_expires: session.active_expires
						? Number(session.active_expires)
						: undefined,
					idle_expires: session.idle_expires
						? Number(session.idle_expires)
						: undefined
				};
				await db.insert(auth_session).values(_session).execute();
			}
		}
	} satisfies LuciaQueryHandler;
}

export function adapterWrapper(db: MySql2Database) {
	return adapter({
		db,
		keys: auth_key,
		sessions: auth_session,
		users: auth_user,
		type: "mysql"
	})(LuciaError);
}
