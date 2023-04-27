import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { Runner, createOperator } from "../src/query.js";
import {
	transformDatabaseKey,
	transformDatabaseSession
} from "../src/utils.js";

import type { PostgresKeySchema, PostgresSessionSchema } from "../src/utils.js";
import type { TestUserSchema } from "@lucia-auth/adapter-test";

export const createQueryHandler = (runner: Runner) => {
	const operator = createOperator(runner);
	return {
		user: {
			get: async () => {
				return await operator.getAll<TestUserSchema>((ctx) => [
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
