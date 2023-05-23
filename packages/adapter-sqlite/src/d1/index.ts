import { createOperator } from "../query.js";
import { d1Runner } from "./runner.js";
import { transformToSqliteValue } from "../utils.js";
import { createCoreAdapter } from "../core.js";

import type { Adapter, AdapterFunction, UserSchema } from "lucia-auth";
import type { SQLiteUserSchema } from "../utils.js";
import type { D1Database } from "@cloudflare/workers-types";

export const d1 = (db: D1Database): AdapterFunction<Adapter> => {
	return (LuciaError) => {
		const operator = createOperator(d1Runner(db));
		const coreAdapter = createCoreAdapter(operator);
		return {
			...coreAdapter,
			setUser: async (userId, attributes, key) => {
				const user = {
					id: userId,
					...attributes
				};
				try {
					if (key) {
						const setUserQuery = operator.write((ctx) => [
							ctx.insertInto("auth_user", user),
							ctx.returning("*")
						]);
						const setKeyQuery = operator.write((ctx) => [
							ctx.insertInto("auth_key", transformToSqliteValue(key))
						]);
						const [setUserResult] = await db.batch([
							db.prepare(setUserQuery.statement).bind(...setUserQuery.params),
							db.prepare(setKeyQuery.statement).bind(...setKeyQuery.params)
						]);
						if (setUserResult.error) throw setUserResult.error;
						if (!setUserResult.results || setUserResult.results.length < 1)
							throw new Error("Unexpected value");
						return setUserResult.results[0] as UserSchema;
					}
					const databaseUser = await operator.get<SQLiteUserSchema>((ctx) => [
						ctx.insertInto("auth_user", user),
						ctx.returning("*")
					]);
					if (!databaseUser) throw new TypeError("Unexpected type");
					return databaseUser;
				} catch (e) {
					const error = e as Partial<{
						cause: Partial<Error>;
					}>;
					if (
						error.cause?.message?.includes("UNIQUE constraint failed") &&
						error.cause?.message?.includes("auth_key.id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			setSession: async (session) => {
				try {
					return await coreAdapter.setSession(session);
				} catch (e) {
					const error = e as Partial<{
						cause: Partial<Error>;
					}>;
					if (error.cause?.message?.includes("FOREIGN KEY constraint failed")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.cause?.message?.includes("UNIQUE constraint failed") &&
						error.cause?.message?.includes("auth_session.id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw e;
				}
			},
			setKey: async (key) => {
				try {
					return await coreAdapter.setKey(key);
				} catch (e) {
					const error = e as Partial<{
						cause: Partial<Error>;
					}>;
					if (error.cause?.message?.includes("FOREIGN KEY constraint failed")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.cause?.message?.includes("UNIQUE constraint failed") &&
						error.cause?.message?.includes("auth_key.id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			}
		};
	};
};
