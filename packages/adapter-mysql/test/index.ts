import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { AsyncRunner, createOperator, SyncRunner } from "../src/query.js";
import {
	transformDatabaseKey,
	transformDatabaseSession
} from "../src/utils.js";

import type {
	MySQLKeySchema,
	MySQLSessionSchema,
	MySQLUserSchema
} from "../src/utils.js";

export const createQueryHandlerFromSyncRunner = (runner: SyncRunner) => {
	const operator = createOperator(runner);
	return {
		user: {
			get: async () => {
				return operator.getAll<MySQLUserSchema>((ctx) => [
					ctx.selectFrom("auth_user", "*")
				]);
			},
			insert: async (user) => {
				operator.run((ctx) => [ctx.insertInto("auth_user", user)]);
			},
			clear: async () => {
				operator.run((ctx) => [ctx.deleteFrom("auth_user")]);
			}
		},
		session: {
			get: async () => {
				return operator
					.getAll<MySQLSessionSchema>((ctx) => [
						ctx.selectFrom("auth_session", "*")
					])
					.map((val) => transformDatabaseSession(val));
			},
			insert: async (key) => {
				operator.run((ctx) => [ctx.insertInto("auth_session", key)]);
			},
			clear: async () => {
				operator.run((ctx) => [ctx.deleteFrom("auth_session")]);
			}
		},
		key: {
			get: async () => {
				return operator
					.getAll<MySQLKeySchema>((ctx) => [ctx.selectFrom("auth_key", "*")])
					.map((val) => transformDatabaseKey(val));
			},
			insert: async (key) => {
				operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
			},
			clear: async () => {
				operator.run((ctx) => [ctx.deleteFrom("auth_key")]);
			}
		}
	} satisfies LuciaQueryHandler;
};

export const createQueryHandlerFromAsyncRunner = (runner: AsyncRunner) => {
	const operator = createOperator(runner);
	return {
		user: {
			get: async () => {
				return operator.getAll<MySQLUserSchema>((ctx) => [
					ctx.selectFrom("auth_user", "*")
				]);
			},
			insert: async (user) => {
				await operator.run((ctx) => [ctx.insertInto("auth_user", user)]);
			},
			clear: async () => {
				await operator.run((ctx) => [ctx.deleteFrom("auth_user")]);
			}
		},
		session: {
			get: async () => {
				const databaseSessions = await operator.getAll<MySQLSessionSchema>(
					(ctx) => [ctx.selectFrom("auth_session", "*")]
				);
				return databaseSessions.map((val) => transformDatabaseSession(val));
			},
			insert: async (key) => {
				await operator.run((ctx) => [ctx.insertInto("auth_session", key)]);
			},
			clear: async () => {
				await operator.run((ctx) => [ctx.deleteFrom("auth_session")]);
			}
		},
		key: {
			get: async () => {
				const databaseKeys = await operator.getAll<MySQLKeySchema>((ctx) => [
					ctx.selectFrom("auth_key", "*")
				]);
				return databaseKeys.map((val) => transformDatabaseKey(val));
			},
			insert: async (key) => {
				await operator.run((ctx) => [ctx.insertInto("auth_key", key)]);
			},
			clear: async () => {
				await operator.run((ctx) => [ctx.deleteFrom("auth_key")]);
			}
		}
	} satisfies LuciaQueryHandler;
};
