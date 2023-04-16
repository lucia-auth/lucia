import type { Adapter, AdapterFunction } from "lucia-auth";
import { eq, and } from "drizzle-orm/expressions";
import { DrizzleAdapterOptions } from "../types";
import { ResultSet } from "@libsql/client";
import type { RunResult } from "better-sqlite3";

export const sqliteAdapter =
	({
		db,
		users,
		sessions,
		keys
	}: DrizzleAdapterOptions<"sqlite">): AdapterFunction<Adapter> =>
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
					.where(and(eq(keys.id, key), eq(keys.primary_key, false)))
					.run();
			},
			async deleteSessionsByUserId(userId) {
				await db.delete(sessions).where(eq(sessions.user_id, userId)).run();
			},
			async deleteUser(userId) {
				await db.delete(users).where(eq(users.id, userId)).run();
			},
			async getKeysByUserId(userId) {
				return await db
					.select()
					.from(keys)
					.where(eq(keys.user_id, userId))
					.all();
			},
			async getKey(keyId, shouldDataBeDeleted) {
				// No transactions in drizzle orm yet
				const key = await db
					.select()
					.from(keys)
					.where(eq(keys.id, keyId))
					.get();

				if (await shouldDataBeDeleted(key)) {
					db.delete(keys).where(eq(keys.id, keyId)).run();
				}
				return key;
			},
			async getSession(sessionId) {
				return await db
					.select()
					.from(sessions)
					.where(eq(sessions.id, sessionId))
					.get();
			},
			async getSessionsByUserId(userId) {
				return db
					.select()
					.from(sessions)
					.where(eq(sessions.user_id, userId))
					.all();
			},
			async getUser(userId) {
				return db.select().from(users).where(eq(users.id, userId)).get();
			},
			async setKey(key) {
				try {
					await db.insert(keys).values(key).run();
				} catch (e) {
					if (
						typeof e === "object" &&
						e !== null &&
						"code" in e &&
						e.code === "SQLITE_CONSTRAINT_FOREIGNKEY"
					)
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (
						typeof e === "object" &&
						e !== null &&
						"code" in e &&
						e.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
					)
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");

					throw new Error(`${e}`);
				}
			},
			async setSession(session) {
				try {
					await db
						.insert(sessions)
						.values({
							...session,
							active_expires: Number(session.active_expires),
							idle_expires: Number(session.idle_expires)
						})
						.run();
				} catch (e) {
					if (
						typeof e === "object" &&
						e !== null &&
						"code" in e &&
						e.code === "SQLITE_CONSTRAINT_FOREIGNKEY"
					)
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (
						typeof e === "object" &&
						e !== null &&
						"code" in e &&
						e.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
					)
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");

					throw new Error(`${e}`);
				}
			},
			async setUser(userId, userAttributes, key) {
				if (key === null) {
					await db
						.insert(users)
						.values({ id: userId, ...userAttributes })
						.run();

					return { ...userAttributes, id: userId };
				}
				try {
					await db.transaction(async (tx) => {
						await tx
							.insert(users)
							.values({ id: userId, ...userAttributes })
							.run();

						await tx.insert(keys).values(key).run();
					});
				} catch (e) {
					if (
						typeof e === "object" &&
						e !== null &&
						"code" in e &&
						e.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
					) {
						// Bandaid solution because bettersqlite3 transactions aren't working :)
						await db.delete(users).where(eq(users.id, userId)).run();
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}

					throw new Error(`${e}`);
				}

				return { ...userAttributes, id: userId };
			},
			async updateKeyPassword(key, hashedPassword) {
				const res = (await db
					.update(keys)
					.set({ hashed_password: hashedPassword })
					.where(eq(keys.id, key))
					.run()) as RunResult | ResultSet;

				if (
					("rowsAffected" in res && res.rowsAffected === 0) ||
					("changes" in res && res.changes === 0)
				)
					throw new LuciaError("AUTH_INVALID_KEY_ID");
			},
			async updateUserAttributes(userId, attributes) {
				const res = await db
					.update(users)
					.set(attributes)
					.where(eq(users.id, userId))
					.run();

				if (
					("rowsAffected" in res && res.rowsAffected === 0) ||
					("changes" in res && res.changes === 0)
				)
					throw new LuciaError("AUTH_INVALID_USER_ID");

				return res as RunResult | ResultSet;
			},
			async getSessionAndUserBySessionId(sessionId) {
				const res = await db
					.select()
					.from(sessions)
					.where(eq(sessions.id, sessionId))
					.innerJoin(users, eq(users.id, sessions.user_id))
					.get();
				if (res === undefined) return null;

				return { user: res["auth_user"], session: res["auth_session"] };
			}
		} satisfies Adapter;

		return adapter;
	};
