import type { Adapter, AdapterFunction } from "lucia-auth";
import { eq, and } from "drizzle-orm/expressions";
import { DrizzleAdapterOptions } from "../types";
import type { QueryError as MySQLError } from "mysql2";

export const mysqlAdapter =
	({
		db,
		users,
		sessions,
		keys
	}: DrizzleAdapterOptions<"mysql">): AdapterFunction<Adapter> =>
	(LuciaError) => {
		const adapter = {
			async deleteKeysByUserId(userId) {
				await db.delete(keys).where(eq(keys.user_id, userId)).execute();
			},
			async deleteSession(sessionId) {
				await db.delete(sessions).where(eq(sessions.id, sessionId)).execute();
			},
			async deleteNonPrimaryKey(key) {
				await db
					.delete(keys)
					.where(and(eq(keys.id, key), eq(keys.primary_key, false)))
					.execute();
			},
			async deleteSessionsByUserId(userId) {
				await db.delete(sessions).where(eq(sessions.user_id, userId)).execute();
			},
			async deleteUser(userId) {
				await db.delete(users).where(eq(users.id, userId)).execute();
			},
			async getKeysByUserId(userId) {
				return await db
					.select()
					.from(keys)
					.where(eq(keys.user_id, userId))
					.execute();
			},
			async getKey(keyId, shouldDataBeDeleted) {
				// No transactions in drizzle orm yet
				const key = (
					await db.select().from(keys).where(eq(keys.id, keyId)).execute()
				)[0];

				if (await shouldDataBeDeleted(key)) {
					await db.delete(keys).where(eq(keys.id, keyId)).execute();
				}
				return key;
			},
			async getSession(sessionId) {
				return (
					await db
						.select()
						.from(sessions)
						.where(eq(sessions.id, sessionId))
						.execute()
				)[0];
			},
			async getSessionsByUserId(userId) {
				return await db
					.select()
					.from(sessions)
					.where(eq(sessions.user_id, userId))
					.execute();
			},
			async getUser(userId) {
				return (
					await db.select().from(users).where(eq(users.id, userId)).execute()
				)[0];
			},
			async setKey(key) {
				// bandaid solution because drizzle orm doesn't generate correct sql for foreign keys (at least I think?)
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, key.user_id))
					.execute();
				if (user.length === 0) throw new LuciaError("AUTH_INVALID_USER_ID");

				try {
					await db.insert(keys).values(key).execute();
				} catch (e) {
					const error = e as Partial<MySQLError>;
					// this won't happen until drizzle orm migration foreign key issues are fixed...
					if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
				}
			},
			async setSession(session) {
				// bandaid solution because drizzle orm doesn't generate correct sql for foreign keys
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, session.user_id))
					.execute();
				if (user.length === 0) throw new LuciaError("AUTH_INVALID_USER_ID");

				try {
					await db
						.insert(sessions)
						.values({
							...session,
							active_expires: Number(session.active_expires),
							idle_expires: Number(session.idle_expires)
						})
						.execute();
				} catch (e) {
					const error = e as Partial<MySQLError>;
					// this won't happen until drizzle orm migration foreign key issues are fixed...
					if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
				}
			},
			async setUser(userId, userAttributes, key) {
				const user = { id: userId, ...userAttributes };
				try {
					if (!key) {
						await db.insert(users).values(user).execute();

						return user;
					}
				} catch (e) {
					const error = e as Partial<MySQLError>;
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}

				try {
					await db.transaction(async (tx) => {
						await tx
							.insert(users)
							.values({ id: userId, ...userAttributes })
							.execute();
						await tx.insert(keys).values(key).execute();
					});
				} catch (e) {
					const error = e as Partial<MySQLError>;
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
				}

				return user;
			},
			async updateKeyPassword(key, hashedPassword) {
				const res = await db
					.update(keys)
					.set({ hashed_password: hashedPassword })
					.where(eq(keys.id, key))
					.execute();
				if (res[0].affectedRows === 0)
					throw new LuciaError("AUTH_INVALID_KEY_ID");
			},
			// TODO: figure out if this works how it's supposed to...
			async updateUserAttributes(userId, attributes) {
				const res = await db
					.update(users)
					.set(attributes)
					.where(eq(users.id, userId))
					.execute();

				if (res[0].affectedRows === 0)
					throw new LuciaError("AUTH_INVALID_USER_ID");
				return { id: userId, ...attributes };
			},
			async getSessionAndUserBySessionId(sessionId) {
				const res = (
					await db
						.select()
						.from(sessions)
						.where(eq(sessions.id, sessionId))
						.innerJoin(users, eq(users.id, sessions.user_id))
						.execute()
				)[0];

				if (!res) return null;

				return { user: res.auth_user, session: res.auth_session };
			}
		} satisfies Adapter;

		return adapter;
	};
