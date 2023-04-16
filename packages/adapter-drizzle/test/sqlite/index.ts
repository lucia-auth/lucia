import { createClient } from "@libsql/client";
import { LibSQLDatabase, drizzle as lsDrizzle } from "drizzle-orm/libsql";
import { auth_key, auth_session } from "../../src/sqlite/schema";
import { testAdapter, LuciaQueryHandler } from "@lucia-auth/adapter-test";
import adapterDrizzle from "../../src";
import { LuciaError } from "lucia-auth";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
	BetterSQLite3Database,
	drizzle as bsDrizzle
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { rm,  } from "node:fs/promises";

await rm("test.db");

export const auth_user = sqliteTable("auth_user", {
	id: text("id").primaryKey().notNull(),
	username: text("username").notNull()
});

console.log("testing libsql client");

const libsql = createClient({
	url: "file:test.db"
});
const libsqlclient = lsDrizzle(libsql);

// the drizzle migrator doesnt work for some reason...
await migrate((sql) => libsql.execute(sql));

testAdapter(adapter(libsqlclient), queryHandler(libsqlclient));

await rm("test.db");

const bsqlite3 = new Database("test.db");
const bsqlite3client = bsDrizzle(bsqlite3);
await migrate((sql) => bsqlite3.exec(sql));
testAdapter(adapter(bsqlite3client), queryHandler(bsqlite3client));

async function migrate(exec: (sql: string) => Promise<any> | any) {
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

function adapter(db: LibSQLDatabase | BetterSQLite3Database) {
	return adapterDrizzle({
		db,
		keys: auth_key,
		sessions: auth_session,
		users: auth_user,
		type: "sqlite"
	})(LuciaError);
}

function queryHandler(db: LibSQLDatabase | BetterSQLite3Database) {
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
