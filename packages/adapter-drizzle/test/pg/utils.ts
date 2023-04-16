import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { pgTable, text } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { auth_key, auth_session } from "../../src/pg/schema";
import { LuciaError } from "lucia-auth";
import adapter from "../../src";

export const auth_user = pgTable("auth_user", {
	id: text("id").primaryKey().notNull(),
	username: text("username").notNull()
});

export function getQueryHandler(db: NodePgDatabase | PostgresJsDatabase) {
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

export function adapterWrapper(db: NodePgDatabase /* | PostgresJsDatabase*/) {
	return adapter({
		db,
		keys: auth_key,
		sessions: auth_session,
		users: auth_user,
		type: "pg"
	})(LuciaError);
}
