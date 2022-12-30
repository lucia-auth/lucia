import { getUpdateData } from "lucia-auth/adapter";
import { Kysely } from "kysely";
import { convertSession } from "./utils.js";
import type { Adapter, AdapterFunction, UserSchema } from "lucia-auth";
import type { DB } from "./dbTypes.js";
import type { DatabaseError as PgDatabaseError } from "pg";
import type { QueryError as MySQLError } from "mysql2";

type SQLiteError = {
	message: string;
	code: string;
};

const adapter =
	(db: Kysely<DB>, dialect: "pg" | "mysql2" | "better-sqlite3"): AdapterFunction<Adapter> =>
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
					if (dialect === "pg") {
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
					}
					const id = userId ?? crypto.randomUUID();
					await db
						.insertInto("user")
						.values({
							id,
							provider_id: data.providerId,
							hashed_password: data.hashedPassword,
							...data.attributes
						})
						.executeTakeFirstOrThrow();
					return {
						id,
						provider_id: data.providerId,
						hashed_password: data.hashedPassword,
						...data.attributes
					} as UserSchema;
				} catch (e) {
					if (dialect === "pg") {
						const error = e as Partial<PgDatabaseError>;
						if (error.code === "23505" && error.detail?.includes("Key (provider_id)")) {
							throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
						}
					}
					if (dialect === "mysql2") {
						const error = e as Partial<MySQLError>;
						if (error.code === "ER_DUP_ENTRY" && error.message?.includes(".provider_id")) {
							throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
						}
					}
					if (dialect === "better-sqlite3") {
						const error = e as Partial<SQLiteError>;
						if (
							error.code === "SQLITE_CONSTRAINT_UNIQUE" &&
							error.message?.includes(".provider_id")
						) {
							throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
						}
					}
					throw e;
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
						.execute();
				} catch (e) {
					if (dialect === "pg") {
						const error = e as Partial<PgDatabaseError>;
						if (error.code === "23503" && error.detail?.includes("Key (user_id)")) {
							throw new LuciaError("AUTH_INVALID_USER_ID");
						}
						if (error.code === "23505" && error.detail?.includes("Key (id)")) {
							throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
						}
					}
					if (dialect === "mysql2") {
						const error = e as Partial<MySQLError>;
						if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
							throw new LuciaError("AUTH_INVALID_USER_ID");
						}
						if (error.code === "ER_DUP_ENTRY" && error.message?.includes("PRIMARY")) {
							throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
						}
					}
					if (dialect === "better-sqlite3") {
						const error = e as Partial<SQLiteError>;
						if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
							const result = await db
								.selectFrom("user")
								.select("id")
								.where("id", "is", data.userId)
								.executeTakeFirst();
							if (!result) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
						}
						if (error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" && error.message?.includes(".id")) {
							throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
						}
					}
					throw e;
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
					if (dialect === "mysql2") {
						await db
							.updateTable("user")
							.set(partialData)
							.where("id", "=", userId)
							.executeTakeFirst();
						const user = await db
							.selectFrom("user")
							.selectAll()
							.where("id", "=", userId)
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
					if (dialect === "pg") {
						const error = e as Partial<PgDatabaseError>;
						if (error.code === "23505" && error.detail?.includes("Key (provider_id)")) {
							throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
						}
					}
					if (dialect === "mysql2") {
						const error = e as Partial<MySQLError>;
						if (error.code === "ER_DUP_ENTRY" && error.message?.includes(".provider_id")) {
							throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
						}
					}
					if (dialect === "better-sqlite3") {
						const error = e as Partial<SQLiteError>;
						if (
							error.code === "SQLITE_CONSTRAINT_UNIQUE" &&
							error.message?.includes(".provider_id")
						) {
							throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
						}
					}
					throw e;
				}
			}
		};
	};

export default adapter;
