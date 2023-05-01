import { transformDatabaseSession, transformDatabaseKey } from "./utils.js";

import type {
	MySQLUserSchema,
	MySQLSessionSchema,
	MySQLKeySchema
} from "./utils.js";
import type {
	KeySchema,
	SessionAdapter,
	SessionSchema,
	UserAdapter
} from "lucia-auth";
import type { Operator } from "./query.js";

export const createUserAdapter = (operator: Operator) => {
	return {
		getUser: async (userId) => {
			return operator.get<MySQLUserSchema>((ctx) => [
				ctx.selectFrom("auth_user", "*"),
				ctx.where("id", "=", userId)
			]);
		},
		deleteUser: async (userId) => {
			await operator.run((ctx) => [
				ctx.deleteFrom("auth_user"),
				ctx.where("id", "=", userId)
			]);
		},
		updateUserAttributes: async (userId, attributes) => {
			if (Object.keys(attributes).length === 0) {
				await operator.run<MySQLUserSchema>((ctx) => [
					ctx.selectFrom("auth_user", "*"),
					ctx.where("id", "=", userId)
				]);
				return;
			}
			await operator.run<MySQLUserSchema>((ctx) => [
				ctx.update("auth_user", attributes),
				ctx.where("id", "=", userId)
			]);
		},
		setKey: async (key) => {
			await operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
		},
		getKey: async (keyId) => {
			const databaseKey = await operator.get<MySQLKeySchema>((ctx) => [
				ctx.selectFrom("auth_key", "*"),
				ctx.where("id", "=", keyId)
			]);
			if (!databaseKey) return null;
			return transformDatabaseKey(databaseKey);
		},
		getKeysByUserId: async (userId) => {
			const databaseKeys = await operator.getAll<MySQLKeySchema>((ctx) => [
				ctx.selectFrom("auth_key", "*"),
				ctx.where("user_id", "=", userId)
			]);
			return databaseKeys.map((val) => transformDatabaseKey(val));
		},
		updateKeyPassword: async (key, hashedPassword) => {
			await operator.run<MySQLKeySchema>((ctx) => [
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
					ctx.where("primary_key", "=", false)
				)
			]);
		}
	} satisfies Omit<UserAdapter, "setUser">;
};

export const createSessionAdapter = (operator: Operator) => {
	return {
		getSession: async (sessionId) => {
			const databaseSession = await operator.get<MySQLSessionSchema>((ctx) => [
				ctx.selectFrom("auth_session", "*"),
				ctx.where("id", "=", sessionId)
			]);
			if (!databaseSession) return null;
			return transformDatabaseSession(databaseSession);
		},
		getSessionsByUserId: async (userId) => {
			const databaseSessions = await operator.getAll<MySQLSessionSchema>(
				(ctx) => [
					ctx.selectFrom("auth_session", "*"),
					ctx.where("user_id", "=", userId)
				]
			);
			return databaseSessions.map((val) => transformDatabaseSession(val));
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
		}
	} satisfies SessionAdapter;
};

export const createUserQueryHelper = (operator: Operator) => {
	return {
		getUser: async (userId: string) => {
			return await operator.get<MySQLUserSchema>((ctx) => [
				ctx.selectFrom("auth_user", "*"),
				ctx.where("id", "=", userId)
			]);
		},
		insertUser: async (userId: string, attributes: Record<string, any>) => {
			const user = {
				id: userId,
				...attributes
			};
			return await operator.run<MySQLUserSchema>((ctx) => [
				ctx.insertInto("auth_user", user)
			]);
		},
		insertKey: async (key: KeySchema) => {
			await operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
		}
	};
};

export const createSessionQueryHelper = (operator: Operator) => {
	return {
		insertSession: async (session: SessionSchema) => {
			await operator.run((ctx) => [ctx.insertInto("auth_session", session)]);
		}
	};
};
