import type { Adapter, AdapterFunction } from "lucia-auth";
import { eq, and } from "drizzle-orm/expressions";
import { DrizzleAdapterOptions } from "../types";

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
					.where(and(eq(keys.id, key), eq(keys.primary_key, true)))
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
				return db.insert(keys).values(key).run();
			},
			async setSession(session) {
				return db
					.insert(sessions)
					.values({
						...session,
						active_expires: Number(session.active_expires),
						idle_expires: Number(session.idle_expires)
					})
					.run();
			},
			async setUser(userId, userAttributes, key) {
				if (!key) {
					return db
						.insert(users)
						.values({ id: userId, ...userAttributes })
						.run();
				}

				// No transactions in drizzle orm yet
				return Promise.all([
					db
						.insert(users)
						.values({ id: userId, ...userAttributes })
						.run(),
					db.insert(keys).values(key).run()
				]);
			},
			async updateKeyPassword(key, hashedPassword) {
				return db
					.update(keys)
					.set({ hashed_password: hashedPassword })
					.where(eq(keys.id, key))
					.run();
			},
			// TODO: figure out if this works how it's supposed to...
			async updateUserAttributes(userId, attributes) {
				return db
					.update(users)
					.set(attributes)
					.where(eq(users.id, userId))
					.get();
			},
			async getSessionAndUserBySessionId(sessionId) {
				const res = await db
					.select()
					.from(sessions)
					.where(eq(sessions.id, sessionId))
					.innerJoin(users, eq(users.id, sessions.user_id))
					.get();

				// in case they name the tables differently (i don't even know if ts would let them do that but just in case)
				return { user: res[users._.name], session: res[sessions._.name] };
			}
		} satisfies Adapter;

		return adapter;
	};
