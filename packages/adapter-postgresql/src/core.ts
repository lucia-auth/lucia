import { transformDatabaseSession, transformDatabaseKey } from "./utils.js";

import type {
	PostgresKeySchema,
	PostgresUserSchema,
	PostgresSessionSchema
} from "./utils.js";
import { Adapter, KeySchema, SessionSchema } from "lucia-auth";
import type { ColumnValue, Operator } from "./query.js";

export const createCoreAdapter = (operator: Operator) => {
	const helper = createQueryHelper(operator);
	return {
		getUser: async (userId) => {
			return await helper.getUser(userId);
		},
		getSessionAndUserBySessionId: async (sessionId) => {
			const data = await operator.get<
				PostgresUserSchema & {
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
		deleteUser: async (userId) => {
			await operator.run((ctx) => [
				ctx.deleteFrom("auth_user"),
				ctx.where("id", "=", userId)
			]);
		},
		setSession: async (session) => {
			await helper.insertSession(session);
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
		setKey: async (key) => {
			await helper.insertKey(key);
		},
		getKey: async (keyId) => {
			const databaseKey = await operator.get<PostgresKeySchema>((ctx) => [
				ctx.selectFrom("auth_key", "*"),
				ctx.where("id", "=", keyId)
			]);
			if (!databaseKey) return null;
			const transformedDatabaseKey = transformDatabaseKey(databaseKey);
			return transformedDatabaseKey;
		},
		getKeysByUserId: async (userId) => {
			const databaseKeys = await operator.getAll<PostgresKeySchema>((ctx) => [
				ctx.selectFrom("auth_key", "*"),
				ctx.where("user_id", "=", userId)
			]);
			return databaseKeys.map((val) => transformDatabaseKey(val));
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
	} satisfies Partial<Adapter>;
};

export const createQueryHelper = (operator: Operator) => {
	return {
		getUser: async (userId: string) => {
			return await operator.get<PostgresUserSchema>((ctx) => [
				ctx.selectFrom("auth_user", "*"),
				ctx.where("id", "=", userId)
			]);
		},
		updateUserAttributes: async (
			userId: string,
			attributes: Record<string, ColumnValue>
		) => {
			return await operator.get<PostgresUserSchema>((ctx) => [
				ctx.update("auth_user", attributes),
				ctx.where("id", "=", userId),
				ctx.returning("*")
			]);
		},
		updateKeyPassword: async (keyId: string, hashedPassword: string | null) => {
			const databaseKey = await operator.get<PostgresKeySchema>((ctx) => [
				ctx.update("auth_key", {
					hashed_password: hashedPassword
				}),
				ctx.where("id", "=", keyId),
				ctx.returning("*")
			]);
			if (!databaseKey) return null;
			return transformDatabaseKey(databaseKey);
		},
		insertUser: async (
			userId: string,
			attributes: Record<string, ColumnValue>
		) => {
			const user = {
				id: userId,
				...attributes
			};
			return await operator.get<PostgresUserSchema>((ctx) => [
				ctx.insertInto("auth_user", user),
				ctx.returning("*")
			]);
		},
		insertSession: async (session: SessionSchema) => {
			await operator.run((ctx) => [ctx.insertInto("auth_session", session)]);
		},
		insertKey: async (key: KeySchema) => {
			await operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
		}
	};
};
