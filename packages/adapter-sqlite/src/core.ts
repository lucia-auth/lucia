import {
	transformDatabaseSession,
	transformDatabaseKey,
	transformToSqliteValue
} from "./utils.js";

import type {
	SQLiteKeySchema,
	SQLiteSessionSchema,
	SQLiteUserSchema
} from "./utils.js";
import type { Adapter } from "lucia-auth";
import type { Operator } from "./query.js";

export const createCoreAdapter = (operator: Operator) => {
	return {
		getUser: async (userId) => {
			return operator.get<SQLiteUserSchema>((ctx) => [
				ctx.selectFrom("auth_user", "*"),
				ctx.where("id", "=", userId)
			]);
		},
		getSessionAndUserBySessionId: async (sessionId) => {
			const data = await operator.get<
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
			const databaseSession = await operator.get<SQLiteSessionSchema>((ctx) => [
				ctx.selectFrom("auth_session", "*"),
				ctx.where("id", "=", sessionId)
			]);
			if (!databaseSession) return null;
			return transformDatabaseSession(databaseSession);
		},
		getSessionsByUserId: async (userId) => {
			const databaseSessions = await operator.getAll<SQLiteSessionSchema>(
				(ctx) => [
					ctx.selectFrom("auth_session", "*"),
					ctx.where("user_id", "=", userId)
				]
			);
			return databaseSessions.map((val) => transformDatabaseSession(val));
		},
		deleteUser: async (userId) => {
			await operator.run((ctx) => [
				ctx.deleteFrom("auth_user"),
				ctx.where("id", "=", userId)
			]);
		},
		setSession: async (session) => {
			await operator.run((ctx) => [ctx.insertInto("auth_session", session)]);
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
				operator.run<SQLiteUserSchema>((ctx) => [
					ctx.selectFrom("auth_user", "*"),
					ctx.where("id", "=", userId)
				]);
				return;
			}
			await operator.run<SQLiteUserSchema>((ctx) => [
				ctx.update("auth_user", attributes),
				ctx.where("id", "=", userId)
			]);
		},
		setKey: async (key) => {
			await operator.run((ctx) => [
				ctx.insertInto("auth_key", transformToSqliteValue(key))
			]);
		},
		getKey: async (keyId) => {
			const databaseKey = await operator.get<SQLiteKeySchema>((ctx) => [
				ctx.selectFrom("auth_key", "*"),
				ctx.where("id", "=", keyId)
			]);
			if (!databaseKey) return null;
			const transformedDatabaseKey = transformDatabaseKey(databaseKey);
			return transformedDatabaseKey;
		},
		getKeysByUserId: async (userId) => {
			const databaseKeys = await operator.getAll<SQLiteKeySchema>((ctx) => [
				ctx.selectFrom("auth_key", "*"),
				ctx.where("user_id", "=", userId)
			]);
			return databaseKeys.map((val) => transformDatabaseKey(val));
		},
		updateKeyPassword: async (key, hashedPassword) => {
			await operator.run<SQLiteKeySchema>((ctx) => [
				ctx.update("auth_key", {
					hashed_password: hashedPassword
				}),
				ctx.where("id", "=", key)
			]);
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
					ctx.where("primary_key", "=", Number(false))
				)
			]);
		}
	} satisfies Partial<Adapter>;
};
