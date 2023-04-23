import { createOperator } from "../query.js";
import { pgRunner } from "./runner.js";
import { transformDatabaseKey, transformDatabaseSession } from "../utils.js";

import type { Adapter, AdapterFunction } from "lucia-auth";
import type { Pool, DatabaseError } from "./types.js";
import type {
	PostgresKeySchema,
	PostgresSessionSchema,
	PostgresUserSchema
} from "../utils.js";

export const pgAdapter = (pool: Pool): AdapterFunction<Adapter> => {
	return (LuciaError) => {
		const operator = createOperator(pgRunner(pool));
		return {
			getUser: async (userId) => {
				return await operator.get<PostgresUserSchema>((ctx) => [
					ctx.selectFrom("auth_user", "*"),
					ctx.where("id", "=", userId)
				]);
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const data = await operator.get<
					PostgresUserSchema & {
						_session_active_expires: string;
						_session_id: string;
						_session_idle_expires: string;
						_session_user_id: string;
					}
				>((ctx) => [
					ctx.selectFrom(
						"auth_session",
						"auth_user.*",
						"auth_session.id as _session_id",
						"auth_session.active_expires as _session_active_expires",
						"auth_session.idle_expires as _session_idle_expires",
						"auth_session.user_id as _session_user_id"
					),
					ctx.innerJoin("auth_user", "auth_user.id", "auth_session.user_id"),
					ctx.where("auth_session.id", "=", sessionId)
				]);
				if (!data) return null;
				const {
					_session_active_expires,
					_session_id,
					_session_idle_expires,
					_session_user_id,
					...user
				} = data;
				return {
					user,
					session: transformDatabaseSession({
						id: _session_id,
						user_id: _session_user_id,
						active_expires: _session_active_expires,
						idle_expires: _session_idle_expires
					})
				};
			},
			getSession: async (sessionId) => {
				const databaseSession = await operator.get<PostgresSessionSchema>(
					(ctx) => [
						ctx.selectFrom("auth_session", "*"),
						ctx.where("id", "=", sessionId)
					]
				);
				if (!databaseSession) return null;
				return transformDatabaseSession(databaseSession);
			},
			getSessionsByUserId: async (userId) => {
				const databaseSessions = await operator.getAll<PostgresSessionSchema>(
					(ctx) => [
						ctx.selectFrom("auth_session", "*"),
						ctx.where("user_id", "=", userId)
					]
				);
				return databaseSessions.map((val) => transformDatabaseSession(val));
			},
			setUser: async (userId, attributes, key) => {
				const user = {
					id: userId,
					...attributes
				};
				try {
					if (key) {
						const databaseUser = await operator.transaction(async () => {
							const databaseUser = await operator.get<PostgresUserSchema>(
								(ctx) => [ctx.insertInto("auth_user", user), ctx.returning("*")]
							);
							if (!databaseUser) throw new TypeError("Unexpected query result");
							await operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
							return databaseUser;
						});
						return databaseUser;
					}
					const databaseUser = await operator.get<PostgresUserSchema>((ctx) => [
						ctx.insertInto("auth_user", user),
						ctx.returning("*")
					]);
					if (!databaseUser) throw new TypeError("Unexpected type");
					return databaseUser;
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await operator.run((ctx) => [
					ctx.deleteFrom("auth_user"),
					ctx.where("id", "=", userId)
				]);
			},
			setSession: async (session) => {
				try {
					await operator.run((ctx) => [
						ctx.insertInto("auth_session", session)
					]);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.code === "23503" &&
						error.detail?.includes("Key (user_id)")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				await operator.run((ctx) => [
					ctx.deleteFrom("auth_session"),
					ctx.where("id", "=", sessionId)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				await operator.run((ctx) => [
					ctx.deleteFrom("auth_session"),
					ctx.where("user_id", "=", userId)
				]);
			},
			updateUserAttributes: async (userId, attributes) => {
				if (Object.keys(attributes).length === 0) {
					const data = await operator.get<PostgresUserSchema>((ctx) => [
						ctx.selectFrom("auth_user", "*"),
						ctx.where("id", "=", userId)
					]);
					if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
					return data;
				}
				const data = await operator.get<PostgresUserSchema>((ctx) => [
					ctx.update("auth_user", attributes),
					ctx.where("id", "=", userId),
					ctx.returning("*")
				]);
				if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
				return data;
			},
			setKey: async (key) => {
				try {
					await operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.code === "23503" &&
						error.detail?.includes("Key (user_id)")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw error;
				}
			},
			getKey: async (keyId) => {
				const databaseKey = await operator.get<PostgresKeySchema>((ctx) => [
					ctx.selectFrom("auth_key", "*"),
					ctx.where("id", "=", keyId)
				]);
				if (!databaseKey) return null;
				return transformDatabaseKey(databaseKey);
			},
			getKeysByUserId: async (userId) => {
				const databaseKeys = await operator.getAll<PostgresKeySchema>((ctx) => [
					ctx.selectFrom("auth_key", "*"),
					ctx.where("user_id", "=", userId)
				]);
				return databaseKeys.map((val) => transformDatabaseKey(val));
			},
			updateKeyPassword: async (key, hashedPassword) => {
				const databaseKey = await operator.get<PostgresKeySchema>((ctx) => [
					ctx.update("auth_key", {
						hashed_password: hashedPassword
					}),
					ctx.where("id", "=", key),
					ctx.returning("*")
				]);
				if (!databaseKey) throw new LuciaError("AUTH_INVALID_KEY_ID");
				return transformDatabaseKey(databaseKey);
			},
			deleteKeysByUserId: async (userId) => {
				await operator.run((ctx) => [
					ctx.deleteFrom("auth_key"),
					ctx.where("user_id", "=", userId)
				]);
			},
			deleteNonPrimaryKey: async (keyId) => {
				await operator.run((ctx) => [
					ctx.deleteFrom("auth_key"),
					ctx.and(
						ctx.where("id", "=", keyId),
						ctx.where("primary_key", "=", false)
					)
				]);
			}
		};
	};
};
