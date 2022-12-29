import { getUpdateData } from "lucia-auth/adapter";
import { Kysely } from "kysely";
import { convertSession } from "./utils.js";
import type { Adapter, AdapterFunction } from "lucia-auth";
import type { DB } from "./dbTypes.js";
import { type DatabaseError } from "pg";

const adapter =
	(db: Kysely<DB>): AdapterFunction<Adapter> =>
	(LuciaError) => {
		return {
			getUser: async (userId) => {
				const data = await db
					.selectFrom("user")
					.selectAll()
					.where("id", "=", userId)
					.executeTakeFirst();
				if (!data) return null;
				return data;
			},
			getUserByProviderId: async (providerId) => {
				const data = await db
					.selectFrom("user")
					.selectAll()
					.where("provider_id", "=", providerId)
					.executeTakeFirst();
				if (!data) return null;
				return data;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
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
			},
			getSession: async (sessionId) => {
				const data = await db
					.selectFrom("session")
					.selectAll()
					.where("id", "=", sessionId)
					.executeTakeFirst();
				if (!data) return null;
				return convertSession(data);
			},
			getSessionsByUserId: async (userId) => {
				const data = await db
					.selectFrom("session")
					.selectAll()
					.where("user_id", "=", userId)
					.execute();
				return data.map((session) => convertSession(session));
			},
			setUser: async (userId, data) => {
				try {
					const user = await db
						.insertInto("user")
						.values({
							id: userId ?? undefined,
							provider_id: data.providerId,
							hashed_password: data.hashedPassword,
							...data.attributes
						})
						.returningAll()
						.executeTakeFirstOrThrow();
					return user;
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (error.code === "23505" && error.detail?.includes("Key (provider_id)")) {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
			},
			deleteUser: async (userId) => {
				await db.deleteFrom("user").where("id", "=", userId).execute();
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
					const error = e as Partial<DatabaseError>;
					if (error.code === "23503" && error.detail?.includes("Key (user_id)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					} else if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw error;
				}
			},
			deleteSession: async (...sessionIds) => {
				await db.deleteFrom("session").where("id", "in", sessionIds).execute();
			},
			deleteSessionsByUserId: async (userId) => {
				await db.deleteFrom("session").where("user_id", "=", userId).execute();
			},
			updateUser: async (userId, newData) => {
				const partialData = getUpdateData(newData);
				try {
					if (Object.keys(partialData).length === 0) {
						const user = await db
							.selectFrom("user")
							.where("id", "=", userId)
							.selectAll()
							.executeTakeFirst();
						if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
						return user;
					}
					const user = await db
						.updateTable("user")
						.set(partialData)
						.where("id", "=", userId)
						.returningAll()
						.executeTakeFirst();
					if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
					return user;
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (error.code === "23505" && error.detail?.includes("Key (provider_id)")) {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
			}
		};
	};

export default adapter;
