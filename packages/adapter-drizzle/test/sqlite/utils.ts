import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { LuciaError } from "lucia-auth";
import adapter from "../../src";
import { auth_key, auth_session } from "../../src/sqlite/schema";

export const auth_user = sqliteTable("auth_user", {
	id: text("id").primaryKey().notNull(),
	username: text("username").notNull()
});

export function adapterWrapper(db: LibSQLDatabase | BetterSQLite3Database) {
	return adapter({
		db,
		keys: auth_key,
		sessions: auth_session,
		users: auth_user,
		type: "sqlite"
	})(LuciaError);
}

export function getQueryHandler(db: LibSQLDatabase | BetterSQLite3Database) {
	return {
		user: {
			async clear() {
				await db.delete(auth_user).run();
			},
			async get() {
				return db.select().from(auth_user).all();
			},
			async insert(user) {
				await db
					.insert(auth_user)
					.values({
						id: user.id,
						username: user.username
					})
					.run();
			}
		},
		key: {
			async clear() {
				await db.delete(auth_key).run();
			},
			async get() {
				return db.select().from(auth_key).all();
			},
			async insert(key) {
				await db.insert(auth_key).values(key).run();
			}
		},
		session: {
			async clear() {
				await db.delete(auth_session).run();
			},
			async get() {
				return db.select().from(auth_session).all();
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
				await db.insert(auth_session).values(_session).run();
			}
		}
	} satisfies LuciaQueryHandler;
}

export async function migrate(exec: (sql: string) => Promise<any> | any) {
	await exec(
		[
			"CREATE TABLE IF NOT EXISTS `auth_key` (",
			"`id` text PRIMARY KEY NOT NULL,",
			"`user_id` text NOT NULL,",
			"`primary_key` boolean NOT NULL,",
			"`hashed_password` text,",
			"`expires` integer,",
			"FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`)",
			")"
		].join("\n")
	);
	await exec(
		[
			"CREATE TABLE IF NOT EXISTS `auth_session` (",
			"`id` text PRIMARY KEY NOT NULL,",
			"`user_id` text NOT NULL,",
			"`active_expires` integer NOT NULL,",
			"`idle_expires` integer NOT NULL,",
			"FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`)",
			")"
		].join("\n")
	);

	await exec(
		[
			"CREATE TABLE IF NOT EXISTS `auth_user` (",
			"`id` text PRIMARY KEY NOT NULL,",
			"`username` text NOT NULL",
			")"
		].join("\n")
	);
}
