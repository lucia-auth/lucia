import type { Adapter, AdapterFunction } from "lucia-auth";
import type {
	SqliteAuthKeyTable,
	SqliteAuthSessionTable,
	SqliteAuthUserTable
} from "./schema";
import { eq, and } from "drizzle-orm/expressions";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

export const adapter =
	({
		db,
		users,
		sessions,
		keys
	}: {
		db: LibSQLDatabase; // TODO: add all sqlite like db's later 
		users: SqliteAuthUserTable;
		sessions: SqliteAuthSessionTable;
		keys: SqliteAuthKeyTable;
	}): AdapterFunction<Adapter> =>
	(LuciaError) => {
		const adapter = {
			async deleteKeysByUserId(userId) {
				await db.delete(keys).where(eq(keys.user_id, userId)).run();
			},
			async deleteSession(sessionId) {
				await db.delete(sessions).where(eq(sessions.id, sessionId)).run();
			},
			async deleteNonPrimaryKey(key) {
				await db
					.delete(keys)
					.where(and(eq(keys.id, key), eq(keys.primary_key, 0)))
					.run();
			},
			async deleteSessionsByUserId(userId) {
				await db.delete(sessions).where(eq(sessions.userId, userId)).run();
			},
			async deleteUser(userId) {
				await db.delete(users).where(eq(users.id, userId)).run();
			},
			async getKeysByUserId(userId) {
				const res = await db
					.select()
					.from(keys)
					.where(eq(keys.user_id, userId))
					.all();

				return res.map((row) => ({ ...row, primary_key: !!row.primary_key }));
			},
			async getKey(keyId, shouldDataBeDeleted) {
				return await db
					.select()
					.from(keys)
					.where(eq(keys.id, keyId))
					.get()
					.then(async (row) => {
						const key = { ...row, primary_key: !!row.primary_key };
						if (await shouldDataBeDeleted(key)) {
							db.delete(keys).where(eq(keys.id, keyId)).run();
						}
						return key;
					});
			}
		} satisfies Adapter;

		return adapter;
	};
