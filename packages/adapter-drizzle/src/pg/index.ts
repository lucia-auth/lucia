import type { Adapter, AdapterFunction } from "lucia-auth";
import { eq, and } from "drizzle-orm/expressions";
import { DrizzleAdapterOptions } from "../types";

export const pgAdapter =
	({
		db,
		users,
		sessions,
		keys
	}: DrizzleAdapterOptions<"pg">): AdapterFunction<Adapter> =>
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
					.where(and(eq(keys.id, key), eq(keys.primary_key, true)))
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
					db.delete(keys).where(eq(keys.id, keyId)).execute();
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
				return db
					.select()
					.from(sessions)
					.where(eq(sessions.user_id, userId))
					.execute();
			},
			async getUser(userId) {
				return db.select().from(users).where(eq(users.id, userId)).execute();
			},
			async setKey(key) {
				return db.insert(keys).values(key).execute();
			},
			async setSession(session) {
				return db
					.insert(sessions)
					.values({
						...session,
						active_expires: Number(session.active_expires),
						idle_expires: Number(session.idle_expires)
					})
					.execute();
			},
			async setUser(userId, userAttributes, key) {
				if (!key) {
					return db
						.insert(users)
						.values({ id: userId, ...userAttributes })
						.execute();
				}

				// No transactions in drizzle orm yet
				return Promise.all([
					db
						.insert(users)
						.values({ id: userId, ...userAttributes })
						.execute(),
					db.insert(keys).values(key).execute()
				]);
			},
			async updateKeyPassword(key, hashedPassword) {
				return db
					.update(keys)
					.set({ hashed_password: hashedPassword })
					.where(eq(keys.id, key))
					.execute();
			},
			// TODO: figure out if this works how it's supposed to...
			async updateUserAttributes(userId, attributes) {
				return db
					.update(users)
					.set(attributes)
					.where(eq(users.id, userId))
					.execute();
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

				// in case they name the tables differently (i don't even know if ts would let them do that but just in case)
				return { user: res[users._.name], session: res[sessions._.name] };
			}
		} satisfies Adapter;

		return adapter;
	};
