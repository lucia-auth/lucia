import { createOperator } from "../query.js";
import { betterSqliteRunner } from "./runner.js";
import {
	transformDatabaseKey,
	transformDatabaseSession,
	transformToSqliteValue
} from "../utils.js";

import type { Adapter, AdapterFunction } from "lucia-auth";
import type { Database } from "better-sqlite3";
import type {
	SQLiteKeySchema,
	SQLiteSessionSchema,
	SQLiteUserSchema
} from "../utils.js";

type BetterSQLiteError = {
	code: string;
	message: string;
};

export const betterSqliteAdapter = (db: Database): AdapterFunction<Adapter> => {
	return (LuciaError) => {
		const operator = createOperator(betterSqliteRunner(db));
		return {
			getUser: async (userId) => {
				return operator.get<SQLiteUserSchema>((ctx) => [
					ctx.selectFrom("auth_user", "*"),
					ctx.where("id", "=", userId)
				]);
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const data = operator.get<
					SQLiteUserSchema & {
						_session_active_expires: number;
						_session_id: string;
						_session_idle_expires: number;
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
				const data = operator.get<SQLiteSessionSchema>((ctx) => [
					ctx.selectFrom("auth_session", "*"),
					ctx.where("id", "=", sessionId)
				]);
				if (!data) return null;
				return transformDatabaseSession(data);
			},
			getSessionsByUserId: async (userId) => {
				const data = operator.getAll<SQLiteSessionSchema>((ctx) => [
					ctx.selectFrom("auth_session", "*"),
					ctx.where("user_id", "=", userId)
				]);
				return data.map((val) => transformDatabaseSession(val));
			},
			setUser: async (userId, attributes, key) => {
				const user = {
					id: userId,
					...attributes
				};
				try {
					if (key) {
						const databaseUser = operator.transaction(() => {
							const databaseUser = operator.get<SQLiteUserSchema>((ctx) => [
								ctx.insertInto("auth_user", user),
								ctx.returning("*")
							]);
							if (!databaseUser) throw new TypeError("Unexpected query result");
							operator.run((ctx) => [
								ctx.insertInto("auth_key", transformToSqliteValue(key))
							]);
							return databaseUser;
						});
						return databaseUser;
					}
					const databaseUser = operator.get<SQLiteUserSchema>((ctx) => [
						ctx.insertInto("auth_user", user),
						ctx.returning("*")
					]);
					if (!databaseUser) throw new TypeError("Unexpected type");
					return databaseUser;
				} catch (e) {
					const error = e as Partial<BetterSQLiteError>;
					if (
						error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
						error.message?.includes(".id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				operator.run((ctx) => [
					ctx.deleteFrom("auth_user"),
					ctx.where("id", "=", userId)
				]);
			},
			setSession: async (session) => {
				try {
					operator.run((ctx) => [ctx.insertInto("auth_session", session)]);
				} catch (e) {
					const error = e as Partial<BetterSQLiteError>;
					if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
						const data = operator.get<SQLiteSessionSchema>((ctx) => [
							ctx.selectFrom("auth_user", "id"),
							ctx.where("id", "=", session.user_id)
						]);
						if (!data) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
						throw e;
					}
					if (
						error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
						error.message?.includes(".id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				operator.run((ctx) => [
					ctx.deleteFrom("auth_session"),
					ctx.where("id", "=", sessionId)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				operator.run((ctx) => [
					ctx.deleteFrom("auth_session"),
					ctx.where("user_id", "=", userId)
				]);
			},
			updateUserAttributes: async (userId, attributes) => {
				if (Object.keys(attributes).length === 0) {
					const data = operator.get<SQLiteUserSchema>((ctx) => [
						ctx.selectFrom("auth_user", "*"),
						ctx.where("id", "=", userId)
					]);
					if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
					return data;
				}
				const data = operator.get<SQLiteUserSchema>((ctx) => [
					ctx.update("auth_user", attributes),
					ctx.where("id", "=", userId),
					ctx.returning("*")
				]);
				if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
				return data;
			},
			setKey: async (key) => {
				try {
					operator.run((ctx) => [
						ctx.insertInto("auth_key", transformToSqliteValue(key))
					]);
				} catch (e) {
					const error = e as Partial<BetterSQLiteError>;
					if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
						const data = operator.get((ctx) => [
							ctx.selectFrom("auth_user", "id"),
							ctx.where("id", "=", key.user_id)
						]);
						if (!data) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
						throw e;
					}
					if (
						error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
						error.message?.includes(".id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			getKey: async (keyId) => {
				const databaseKey = operator.get<SQLiteKeySchema>((ctx) => [
					ctx.selectFrom("auth_key", "*"),
					ctx.where("id", "=", keyId)
				]);
				if (!databaseKey) return null;
				const transformedDatabaseKey = transformDatabaseKey(databaseKey);
				return transformedDatabaseKey;
			},
			getKeysByUserId: async (userId) => {
				const databaseKeys = operator.getAll<SQLiteKeySchema>((ctx) => [
					ctx.selectFrom("auth_key", "*"),
					ctx.where("user_id", "=", userId)
				]);
				return databaseKeys.map((val) => transformDatabaseKey(val));
			},
			updateKeyPassword: async (key, hashedPassword) => {
				const databaseKey = operator.get<SQLiteKeySchema>((ctx) => [
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
				operator.run((ctx) => [
					ctx.deleteFrom("auth_key"),
					ctx.where("user_id", "=", userId)
				]);
			},
			deleteNonPrimaryKey: async (keyId) => {
				operator.run((ctx) => [
					ctx.deleteFrom("auth_key"),
					ctx.and(ctx.where("id", "=", keyId), ctx.where("primary_key", "=", 0))
				]);
			}
		};
	};
};
