import { createOperator } from "../query.js";
import { betterSqliteRunner } from "./runner.js";
import { transformToSqliteValue } from "../utils.js";
import { createCoreAdapter } from "../core.js";

import type { Adapter, AdapterFunction } from "lucia-auth";
import type { Database, SqliteError } from "better-sqlite3";
import type { SQLiteUserSchema } from "../utils.js";

type BetterSQLiteError = SqliteError["prototype"];

export const betterSqliteAdapter = (db: Database): AdapterFunction<Adapter> => {
	const transaction = async <_Execute extends () => Promise<any>>(
		execute: _Execute
	): Promise<Awaited<ReturnType<_Execute>>> => {
		try {
			db.exec("BEGIN TRANSACTION");
			const result = execute();
			db.exec("COMMIT");
			return result;
		} catch (e) {
			if (db.inTransaction) {
				db.exec("ROLLBACK");
			}
			throw e;
		}
	};

	return (LuciaError) => {
		const operator = createOperator(betterSqliteRunner(db));
		const coreAdapter = createCoreAdapter(operator);
		return {
			getUser: coreAdapter.getUser,
			getSessionAndUserBySessionId: coreAdapter.getSessionAndUserBySessionId,
			getSession: coreAdapter.getSession,
			getSessionsByUserId: coreAdapter.getSessionsByUserId,
			setUser: async (userId, attributes, key) => {
				const user = {
					id: userId,
					...attributes
				};
				try {
					if (key) {
						const databaseUser = await transaction(async () => {
							const databaseUser = await operator.get<SQLiteUserSchema>(
								(ctx) => [ctx.insertInto("auth_user", user), ctx.returning("*")]
							);
							if (!databaseUser) throw new TypeError("Unexpected query result");
							await operator.run((ctx) => [
								ctx.insertInto("auth_key", transformToSqliteValue(key))
							]);
							return databaseUser;
						});
						return databaseUser;
					}
					const databaseUser = await operator.get<SQLiteUserSchema>((ctx) => [
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
			deleteUser: coreAdapter.deleteUser,
			setSession: async (session) => {
				try {
					return await coreAdapter.setSession(session);
				} catch (e) {
					const error = e as Partial<BetterSQLiteError>;
					if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
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
			deleteSession: coreAdapter.deleteSession,
			deleteSessionsByUserId: coreAdapter.deleteSessionsByUserId,
			updateUserAttributes: coreAdapter.updateUserAttributes,
			setKey: async (key) => {
				try {
					return await coreAdapter.setKey(key);
				} catch (e) {
					const error = e as Partial<BetterSQLiteError>;
					if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
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
			getKey: coreAdapter.getKey,
			getKeysByUserId: coreAdapter.getKeysByUserId,
			updateKeyPassword: coreAdapter.updateKeyPassword,
			deleteKeysByUserId: coreAdapter.deleteKeysByUserId,
			deleteNonPrimaryKey: coreAdapter.deleteNonPrimaryKey
		};
	};
};
