import { helper, getSetArgs, escapeName } from "../utils.js";

import type {
	SessionSchema,
	Adapter,
	InitializeAdapter,
	UserSchema,
	KeySchema
} from "lucia";
import type { D1Database } from "@cloudflare/workers-types";

export const d1Adapter = (
	db: D1Database,
	tables: {
		user: string;
		session: string;
		key: string;
	}
): InitializeAdapter<Adapter> => {
	const ESCAPED_USER_TABLE_NAME = escapeName(tables.user);
	const ESCAPED_SESSION_TABLE_NAME = escapeName(tables.session);
	const ESCAPED_KEY_TABLE_NAME = escapeName(tables.key);

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const user = await db
					.prepare(`SELECT * FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`)
					.bind(userId)
					.first<UserSchema | null>();
				return user;
			},
			setUser: async (user, key) => {
				const [userFields, userValues, userArgs] = helper(user);
				const insertUserStatement = db
					.prepare(
						`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`
					)
					.bind(...userArgs);
				if (!key) {
					await insertUserStatement.run<void>();
					return;
				}
				try {
					const [keyFields, keyValues, keyArgs] = helper(key);
					const insertKeyStatement = db
						.prepare(
							`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${keyFields} ) VALUES ( ${keyValues} )`
						)
						.bind(...keyArgs);
					await db.batch([insertUserStatement, insertKeyStatement]);
				} catch (e) {
					const error = e as Partial<{
						cause: Partial<Error>;
					}>;
					if (
						error.cause?.message?.includes("UNIQUE constraint failed") &&
						error.cause?.message?.includes(`${tables.key}.id`)
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await db
					.prepare(`DELETE FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`)
					.bind(userId)
					.run();
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await db
					.prepare(
						`UPDATE ${ESCAPED_USER_TABLE_NAME} SET ${getSetArgs(
							fields,
							values
						)} WHERE id = ?`
					)
					.bind(...args, userId)
					.run();
			},

			getSession: async (sessionId) => {
				const session = await db
					.prepare(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`)
					.bind(sessionId)
					.first<SessionSchema | null>();
				return session;
			},
			getSessionsByUserId: async (userId) => {
				const { results: sessionResults } = await db
					.prepare(
						`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`
					)
					.bind(userId)
					.all<SessionSchema>();
				return sessionResults ?? [];
			},
			setSession: async (session) => {
				try {
					const [fields, values, args] = helper(session);
					await db
						.prepare(
							`INSERT INTO ${ESCAPED_SESSION_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`
						)
						.bind(...args)
						.run();
				} catch (e) {
					const error = e as Partial<{
						cause: Partial<Error>;
					}>;
					if (error.cause?.message?.includes("FOREIGN KEY constraint failed")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				await db
					.prepare(`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`)
					.bind(sessionId)
					.run();
			},
			deleteSessionsByUserId: async (userId) => {
				await db
					.prepare(
						`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`
					)
					.bind(userId)
					.run();
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				await db
					.prepare(
						`UPDATE ${ESCAPED_SESSION_TABLE_NAME} SET ${getSetArgs(
							fields,
							values
						)} WHERE id = ?`
					)
					.bind(...args, sessionId)
					.run();
			},

			getKey: async (keyId) => {
				const key = await db
					.prepare(`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`)
					.bind(keyId)
					.first<KeySchema | null>();
				return key;
			},
			getKeysByUserId: async (userId) => {
				const { results: keyResults } = await db
					.prepare(`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`)
					.bind(userId)
					.all<KeySchema>();
				return keyResults ?? [];
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await db
						.prepare(
							`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`
						)
						.bind(...args)
						.run();
				} catch (e) {
					const error = e as Partial<{
						cause: Partial<Error>;
					}>;
					if (error.cause?.message?.includes("FOREIGN KEY constraint failed")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.cause?.message?.includes("UNIQUE constraint failed") &&
						error.cause?.message?.includes(`${tables.key}.id`)
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteKey: async (keyId) => {
				await db
					.prepare(`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`)
					.bind(keyId)
					.run();
			},
			deleteKeysByUserId: async (userId) => {
				await db
					.prepare(`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`)
					.bind(userId)
					.run();
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await db
					.prepare(
						`UPDATE ${ESCAPED_KEY_TABLE_NAME} SET ${getSetArgs(
							fields,
							values
						)} WHERE id = ?`
					)
					.bind(...args, keyId)
					.run();
			},

			getSessionAndUser: async (sessionId) => {
				const getSessionStatement = db
					.prepare(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`)
					.bind(sessionId);
				const getUserFromJoinStatement = db
					.prepare(
						`SELECT ${ESCAPED_USER_TABLE_NAME}.*, ${ESCAPED_SESSION_TABLE_NAME}.id as __session_id FROM ${ESCAPED_SESSION_TABLE_NAME} INNER JOIN ${ESCAPED_USER_TABLE_NAME} ON ${ESCAPED_USER_TABLE_NAME}.id = ${ESCAPED_SESSION_TABLE_NAME}.user_id WHERE ${ESCAPED_SESSION_TABLE_NAME}.id = ?`
					)
					.bind(sessionId);
				type BatchQueryResult<Schema extends {}> = {
					error: any;
					results?: Schema[];
				};
				const [{ results: sessionResults }, { results: userFromJoinResults }] =
					(await db.batch([
						getSessionStatement,
						getUserFromJoinStatement
					])) as any as [
						BatchQueryResult<SessionSchema>,
						BatchQueryResult<
							UserSchema & {
								__session_id: string;
							}
						>
					];
				const sessionResult = sessionResults?.at(0) ?? null;
				const userFromJoinResult = userFromJoinResults?.at(0) ?? null;
				if (!sessionResult || !userFromJoinResult) return [null, null];
				const { __session_id: _, ...userResult } = userFromJoinResult;
				return [sessionResult, userResult];
			}
		};
	};
};
