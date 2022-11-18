import { LuciaError } from "lucia-auth";
import type { Adapter } from "lucia-auth";
import { getUpdateData } from "lucia-auth/adapter";
import { Kysely } from "kysely";
import { DatabaseError } from "pg";
import { DB } from "./dbTypes.js";
import { convertSession } from "./utils.js";

const adapter = (
	db: Kysely<DB>,
	errorHandler: (error: DatabaseError) => void = () => {}
): Adapter => {
	return {
		getUser: async (userId) => {
			try {
				const data = await db
					.selectFrom("user")
					.selectAll()
					.where("id", "=", userId)
					.executeTakeFirst();
				if (!data) return null;
				return data;
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getUserByProviderId: async (providerId) => {
			try {
				const data = await db
					.selectFrom("user")
					.selectAll()
					.where("provider_id", "=", providerId)
					.executeTakeFirst();
				if (!data) return null;
				return data;
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSessionAndUserBySessionId: async (sessionId) => {
			try {
				const data = await db
					.selectFrom("user")
					.innerJoin("session", "user.id", "session.user_id")
					.selectAll()
					.where("session.id", "=", sessionId)
					.executeTakeFirst();
				if (!data) return null;
				const { id, user_id, expires, idle_expires, ...user } = data;
				return {
					user: { ...user, id: user_id },
					session: convertSession({ id, user_id, expires, idle_expires })
				};
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSession: async (sessionId) => {
			try {
				const data = await db
					.selectFrom("session")
					.selectAll()
					.where("id", "=", sessionId)
					.executeTakeFirst();
				if (!data) return null;
				return convertSession(data);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSessionsByUserId: async (userId) => {
			try {
				const data = await db
					.selectFrom("session")
					.selectAll()
					.where("user_id", "=", userId)
					.execute();
				return data.map((session) => convertSession(session));
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		setUser: async (userId, data) => {
			try {
				const user = await db
					.insertInto("user")
					.values({
						id: userId || undefined,
						provider_id: data.providerId,
						hashed_password: data.hashedPassword,
						...data.attributes
					})
					.returningAll()
					.executeTakeFirstOrThrow();
				return user;
			} catch (e) {
				const error = e as DatabaseError;
				if (error.code === "23505" && error.detail?.includes("Key (provider_id)")) {
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				}
				errorHandler(e as any);
				throw e;
			}
		},
		deleteUser: async (userId) => {
			try {
				await db.deleteFrom("user").where("id", "=", userId).execute();
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		setSession: async (sessionId, data) => {
			try {
				await db
					.insertInto("session")
					.values({
						id: sessionId,
						user_id: data.userId,
						expires: data.expires,
						idle_expires: data.idlePeriodExpires
					})
					.returningAll()
					.execute();
			} catch (e) {
				const error = e as DatabaseError;
				if (error.code === "23503" && error.detail?.includes("Key (user_id)")) {
					throw new LuciaError("AUTH_INVALID_USER_ID");
				} else if (error.code === "23505" && error.detail?.includes("Key (id)")) {
					throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
				}
				errorHandler(e as any);
				throw e;
			}
		},
		deleteSession: async (...sessionIds) => {
			try {
				await db.deleteFrom("session").where("id", "in", sessionIds).execute();
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		deleteSessionsByUserId: async (userId) => {
			try {
				await db.deleteFrom("session").where("user_id", "=", userId).execute();
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		updateUser: async (userId, newData) => {
			const partialData = getUpdateData(newData);
			try {
				let user;
				if (Object.keys(partialData).length === 0) {
					user = await db
						.selectFrom("user")
						.where("id", "=", userId)
						.selectAll()
						.executeTakeFirst();
				} else {
					user = await db
						.updateTable("user")
						.set(partialData)
						.where("id", "=", userId)
						.returningAll()
						.executeTakeFirst();
				}
				if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
				return user;
			} catch (e) {
				if (e instanceof LuciaError) throw e;
				const error = e as DatabaseError;
				if (error.code === "23505" && error.detail?.includes("Key (provider_id)")) {
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				}
				errorHandler(e as any);
				throw e;
			}
		}
	};
};

export default adapter;
