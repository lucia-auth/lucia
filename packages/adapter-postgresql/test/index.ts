import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { AsyncRunner, createOperator, SyncRunner } from "../src/query.js";
import {
	transformDatabaseKey,
	transformDatabaseSession
} from "../src/utils.js";

import type {
	PostgresKeySchema,
	PostgresSessionSchema,
	PostgresUserSchema
} from "../src/utils.js";

export const createQueryHandlerFromSyncRunner = (runner: SyncRunner) => {
	const operator = createOperator(runner);
	return {
		user: {
			get: async () => {
				return operator.getAll<PostgresUserSchema>((ctx) => [
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
					.getAll<PostgresSessionSchema>((ctx) => [
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
					.getAll<PostgresKeySchema>((ctx) => [ctx.selectFrom("auth_key", "*")])
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
				return await operator.getAll<PostgresUserSchema>((ctx) => [
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
				const result = await operator.getAll<PostgresSessionSchema>((ctx) => [
					ctx.selectFrom("auth_session", "*")
				]);
				return result.map((val) => transformDatabaseSession(val));
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
				const result = await operator.getAll<PostgresKeySchema>((ctx) => [
					ctx.selectFrom("auth_key", "*")
				]);
				return result.map((val) => transformDatabaseKey(val));
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
