import {
	helper,
	getSetArgs,
	escapeName,
	transformPgSession,
	PgSession
} from "../utils.js";

import type { Adapter, InitializeAdapter, UserSchema, KeySchema } from "lucia";

import type { Sql, PostgresError, Row } from "postgres";

class DBOpsBase {
	sql: Sql;

	constructor(sql: Sql) {
		this.sql = sql;
	}

	async exec(query: string, arg?: any[]) {
		return this.sql.unsafe(query, arg);
	}

	async get<T extends Row>(query: string, arg?: any[]) {
		const res = await this.sql.unsafe<T[]>(query, arg);
		return res.at(0) ?? null;
	}

	async getAll<T extends Row>(query: string, arg?: any[]) {
		return Array.from(await this.sql.unsafe<T[]>(query, arg));
	}

	processException(e: any) {
		return e as Partial<PostgresError>;
	}
}

export type TXHandler = (fn: DBOpsBase) => Promise<any>;

export class DBOps extends DBOpsBase {
	constructor(sql: Sql) {
		super(sql);
	}

	async transaction(fn: TXHandler) {
		return await this.sql.begin(async (sql: Sql) => {
			return await fn(new DBOpsBase(sql));
		});
	}
}

export const postgresAdapter = (
	sql: Sql,
	tables: {
		user: string;
		session: string;
		key: string;
	}
): InitializeAdapter<Adapter> => {
	const ops = new DBOps(sql);

	const ESCAPED_USER_TABLE_NAME = escapeName(tables.user);
	const ESCAPED_SESSION_TABLE_NAME = escapeName(tables.session);
	const ESCAPED_KEY_TABLE_NAME = escapeName(tables.key);

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				return await ops.get<UserSchema>(
					`SELECT * FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = $1`,
					[userId]
				);
			},
			setUser: async (user, key) => {
				if (!key) {
					const [userFields, userValues, userArgs] = helper(user);
					await ops.exec(
						`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
						userArgs
					);
					return;
				}
				try {
					await ops.transaction(async (tx) => {
						const [userFields, userValues, userArgs] = helper(user);
						await tx.exec(
							`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
							userArgs
						);
						const [keyFields, keyValues, keyArgs] = helper(key);
						await tx.exec(
							`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${keyFields} ) VALUES ( ${keyValues} )`,
							keyArgs
						);
					});
				} catch (e) {
					const error = ops.processException(e);
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await ops.exec(`DELETE FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = $1`, [
					userId
				]);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await ops.exec(
					`UPDATE ${ESCAPED_USER_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = $${fields.length + 1}`,
					[...args, userId]
				);
			},

			getSession: async (sessionId) => {
				const result = await ops.get<PgSession>(
					`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = $1`,
					[sessionId]
				);
				return result ? transformPgSession(result) : null;
			},
			getSessionsByUserId: async (userId) => {
				const result = await ops.getAll<PgSession>(
					`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = $1`,
					[userId]
				);
				return result.map((val) => transformPgSession(val));
			},
			setSession: async (session) => {
				try {
					const [fields, values, args] = helper(session);
					await ops.exec(
						`INSERT INTO ${ESCAPED_SESSION_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = ops.processException(e);
					if (
						error.code === "23503" &&
						error.detail?.includes("Key (user_id)")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				await ops.exec(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = $1`,
					[sessionId]
				);
			},
			deleteSessionsByUserId: async (userId) => {
				await ops.exec(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = $1`,
					[userId]
				);
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				await ops.exec(
					`UPDATE ${ESCAPED_SESSION_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = $${fields.length + 1}`,
					[...args, sessionId]
				);
			},

			getKey: async (keyId) => {
				const result = await ops.get<KeySchema>(
					`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = $1`,
					[keyId]
				);
				return result;
			},
			getKeysByUserId: async (userId) => {
				const result = ops.getAll<KeySchema>(
					`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = $1`,
					[userId]
				);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await ops.exec(
						`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = ops.processException(e);
					if (
						error.code === "23503" &&
						error.detail?.includes("Key (user_id)")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteKey: async (keyId) => {
				await ops.exec(`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = $1`, [
					keyId
				]);
			},
			deleteKeysByUserId: async (userId) => {
				await ops.exec(
					`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = $1`,
					[userId]
				);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await ops.exec(
					`UPDATE ${ESCAPED_KEY_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = $${fields.length + 1}`,
					[...args, keyId]
				);
			},

			getSessionAndUser: async (sessionId) => {
				const getSessionPromise = ops.get<PgSession>(
					`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = $1`,
					[sessionId]
				);
				const getUserFromJoinPromise = ops.get<
					UserSchema & {
						__session_id: string;
					}
				>(
					`SELECT ${ESCAPED_USER_TABLE_NAME}.*, ${ESCAPED_SESSION_TABLE_NAME}.id as __session_id FROM ${ESCAPED_SESSION_TABLE_NAME} INNER JOIN ${ESCAPED_USER_TABLE_NAME} ON ${ESCAPED_USER_TABLE_NAME}.id = ${ESCAPED_SESSION_TABLE_NAME}.user_id WHERE ${ESCAPED_SESSION_TABLE_NAME}.id = $1`,
					[sessionId]
				);
				const [sessionResult, userFromJoinResult] = await Promise.all([
					getSessionPromise,
					getUserFromJoinPromise
				]);
				if (!sessionResult || !userFromJoinResult) return [null, null];
				const { __session_id: _, ...userResult } = userFromJoinResult;
				return [transformPgSession(sessionResult), userResult];
			}
		};
	};
};
