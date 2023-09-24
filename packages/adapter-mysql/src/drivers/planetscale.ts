import { escapeName, getSetArgs, helper } from "../utils.js";

import type {
	Connection,
	DatabaseError,
	ExecutedQuery
} from "@planetscale/database";
import type {
	Adapter,
	InitializeAdapter,
	UserSchema,
	SessionSchema,
	KeySchema
} from "lucia";

export const planetscaleAdapter = (
	connection: Pick<Connection, "execute" | "transaction">,
	tables: {
		user: string;
		session: string | null;
		key: string;
	}
): InitializeAdapter<Adapter> => {
	const ESCAPED_USER_TABLE_NAME = escapeName(tables.user);
	const ESCAPED_SESSION_TABLE_NAME = tables.session
		? escapeName(tables.session)
		: null;
	const ESCAPED_KEY_TABLE_NAME = escapeName(tables.key);

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const result = await get<UserSchema>(
					connection.execute(
						`SELECT * FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`,
						[userId]
					)
				);
				return result;
			},
			setUser: async (user, key) => {
				if (!key) {
					const [userFields, userValues, userArgs] = helper(user);
					await connection.execute(
						`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
						userArgs
					);
					return;
				}
				try {
					await connection.transaction(async (tx) => {
						const [userFields, userValues, userArgs] = helper(user);
						await tx.execute(
							`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
							userArgs
						);
						const [keyFields, keyValues, keyArgs] = helper(key);
						await tx.execute(
							`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${keyFields} ) VALUES ( ${keyValues} )`,
							keyArgs
						);
					});
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY") &&
						error.body?.message.includes(`${tables.key}`)
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await connection.execute(
					`DELETE FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`,
					[userId]
				);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await connection.execute(
					`UPDATE ${ESCAPED_USER_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					[...args, userId]
				);
			},

			getSession: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const result = await get<SessionSchema>(
					connection.execute(
						`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
						[sessionId]
					)
				);
				return result
			},
			getSessionsByUserId: async (userId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const result = await getAll<SessionSchema>(
					connection.execute(
						`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
						[userId]
					)
				);
				return result
			},
			setSession: async (session) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const [fields, values, args] = helper(session);
				await connection.execute(
					`INSERT INTO ${ESCAPED_SESSION_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
					args
				);
			},
			deleteSession: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				await connection.execute(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					[sessionId]
				);
			},
			deleteSessionsByUserId: async (userId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				await connection.execute(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
					[userId]
				);
			},
			updateSession: async (sessionId, partialSession) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const [fields, values, args] = helper(partialSession);
				await connection.execute(
					`UPDATE ${ESCAPED_SESSION_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					[...args, sessionId]
				);
			},

			getKey: async (keyId) => {
				const result = await get<KeySchema>(
					connection.execute(
						`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`,
						[keyId]
					)
				);
				return result;
			},
			getKeysByUserId: async (userId) => {
				const result = getAll<KeySchema>(
					connection.execute(
						`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
						[userId]
					)
				);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await connection.execute(
						`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY") &&
						error.body?.message.includes(`${tables.key}`)
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteKey: async (keyId) => {
				await connection.execute(
					`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`,
					[keyId]
				);
			},
			deleteKeysByUserId: async (userId) => {
				await connection.execute(
					`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
					[userId]
				);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await connection.execute(
					`UPDATE ${ESCAPED_KEY_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					[...args, keyId]
				);
			},

			getSessionAndUser: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const [sessionResult, userFromJoinResult] = await Promise.all([
					get<SessionSchema>(
						connection.execute(
							`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
							[sessionId]
						)
					),
					get<
						UserSchema & {
							__session_id: string;
						}
					>(
						connection.execute(
							`SELECT ${ESCAPED_USER_TABLE_NAME}.*, ${ESCAPED_SESSION_TABLE_NAME}.id as __session_id FROM ${ESCAPED_SESSION_TABLE_NAME} INNER JOIN ${ESCAPED_USER_TABLE_NAME} ON ${ESCAPED_USER_TABLE_NAME}.id = ${ESCAPED_SESSION_TABLE_NAME}.user_id WHERE ${ESCAPED_SESSION_TABLE_NAME}.id = ?`,
							[sessionId]
						)
					)
				]);
				if (!sessionResult || !userFromJoinResult) return [null, null];
				const { __session_id: _, ...userResult } = userFromJoinResult;
				return [sessionResult, userResult];
			}
		};
	};
};

export const get = async <Schema>(
	queryPromise: Promise<ExecutedQuery>
): Promise<Schema | null> => {
	const { rows } = await queryPromise;
	const result = rows.at(0) ?? null;
	return result as any;
};

export const getAll = async <Schema>(
	queryPromise: Promise<ExecutedQuery>
): Promise<Schema[]> => {
	const { rows } = await queryPromise;
	return rows as any;
};