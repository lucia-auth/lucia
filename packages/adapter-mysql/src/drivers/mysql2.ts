import { helper, getSetArgs, escapeName } from "../utils.js";

import type {
	SessionSchema,
	Adapter,
	InitializeAdapter,
	UserSchema,
	KeySchema
} from "lucia";
import type {
	Pool,
	QueryError,
	RowDataPacket,
	OkPacket,
	ResultSetHeader,
	PoolConnection
} from "mysql2/promise";

export const mysql2Adapter = (
	db: Pool,
	tables: {
		user: string;
		session: string;
		key: string;
	}
): InitializeAdapter<Adapter> => {
	const ESCAPED_USER_TABLE_NAME = escapeName(tables.user);
	const ESCAPED_SESSION_TABLE_NAME = escapeName(tables.session);
	const ESCAPED_KEY_TABLE_NAME = escapeName(tables.key);

	const transaction = async <
		_Execute extends (connection: PoolConnection) => Promise<void>
	>(
		execute: _Execute
	) => {
		const connection = await db.getConnection();
		try {
			await connection.beginTransaction();
			await execute(connection);
			await connection.commit();
			return;
		} catch (e) {
			await connection.rollback();
			throw e;
		}
	};
	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const result = await get<UserSchema>(
					db.query(`SELECT * FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`, [
						userId
					])
				);
				return result;
			},
			setUser: async (user, key) => {
				if (!key) {
					const [userFields, userValues, userArgs] = helper(user);
					await db.execute(
						`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
						userArgs
					);
					return;
				}
				try {
					await transaction(async (connection) => {
						const [userFields, userValues, userArgs] = helper(user);
						await connection.execute(
							`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
							userArgs
						);
						const [keyFields, keyValues, keyArgs] = helper(key);
						await connection.execute(
							`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${keyFields} ) VALUES ( ${keyValues} )`,
							keyArgs
						);
					});
				} catch (e) {
					const error = e as Partial<QueryError>;
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY") &&
						error.message?.includes(tables.key)
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await db.query(`DELETE FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`, [
					userId
				]);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await db.execute(
					`UPDATE ${ESCAPED_USER_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					[...args, userId]
				);
			},

			getSession: async (sessionId) => {
				const result = await get<SessionSchema>(
					db.query(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`, [
						sessionId
					])
				);
				return result;
			},
			getSessionsByUserId: async (userId) => {
				const result = await getAll<SessionSchema>(
					db.query(
						`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
						[userId]
					)
				);
				return result;
			},
			setSession: async (session) => {
				try {
					const [fields, values, args] = helper(session);
					await db.execute(
						`INSERT INTO ${ESCAPED_SESSION_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = e as Partial<QueryError>;
					if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				await db.execute(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					[sessionId]
				);
			},
			deleteSessionsByUserId: async (userId) => {
				await db.execute(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
					[userId]
				);
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				await db.execute(
					`UPDATE ${ESCAPED_SESSION_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					[...args, sessionId]
				);
			},

			getKey: async (keyId) => {
				const result = await get<KeySchema>(
					db.query(`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`, [
						keyId
					])
				);
				return result;
			},
			getKeysByUserId: async (userId) => {
				const result = getAll<KeySchema>(
					db.execute(
						`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
						[userId]
					)
				);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await db.execute(
						`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = e as Partial<QueryError>;
					if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY") &&
						error.message?.includes(tables.key)
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteKey: async (keyId) => {
				await db.execute(`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`, [
					keyId
				]);
			},
			deleteKeysByUserId: async (userId) => {
				await db.execute(
					`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
					[userId]
				);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await db.execute(
					`UPDATE ${ESCAPED_KEY_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					[...args, keyId]
				);
			},

			getSessionAndUser: async (sessionId) => {
				const getSessionPromise = get<SessionSchema>(
					db.query(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`, [
						sessionId
					])
				);
				const getUserFromJoinPromise = get<
					UserSchema & {
						__session_id: string;
					}
				>(
					db.query(
						`SELECT ${ESCAPED_USER_TABLE_NAME}.*, ${ESCAPED_SESSION_TABLE_NAME}.id as __session_id FROM ${ESCAPED_SESSION_TABLE_NAME} INNER JOIN ${ESCAPED_USER_TABLE_NAME} ON ${ESCAPED_USER_TABLE_NAME}.id = ${ESCAPED_SESSION_TABLE_NAME}.user_id WHERE ${ESCAPED_SESSION_TABLE_NAME}.id = ?`,
						[sessionId]
					)
				);
				const [sessionResult, userFromJoinResult] = await Promise.all([
					getSessionPromise,
					getUserFromJoinPromise
				]);
				if (!sessionResult || !userFromJoinResult) return [null, null];
				const { __session_id: _, ...userResult } = userFromJoinResult;
				return [sessionResult, userResult];
			}
		};
	};
};

const isPacketArray = (
	maybeRowDataPacketArray: RowDataPacket[] | RowDataPacket[][] | OkPacket[]
): maybeRowDataPacketArray is RowDataPacket[] => {
	const firstVal = maybeRowDataPacketArray.at(0) ?? null;
	if (!firstVal) return true;
	if (!Array.isArray(firstVal)) return true;
	return false;
};
export const get = async <Schema>(
	queryPromise: Promise<
		[
			(
				| RowDataPacket[]
				| RowDataPacket[][]
				| OkPacket
				| OkPacket[]
				| ResultSetHeader
			),
			any
		]
	>
): Promise<Schema | null> => {
	const [rows] = await queryPromise;
	if (!Array.isArray(rows)) return null;
	const result = rows.at(0) ?? null;
	if (!result || Array.isArray(result)) return null;
	return result as any;
};

export const getAll = async <Schema>(
	queryPromise: Promise<
		[
			(
				| RowDataPacket[]
				| RowDataPacket[][]
				| OkPacket
				| OkPacket[]
				| ResultSetHeader
			),
			any
		]
	>
): Promise<Schema[]> => {
	const [rows] = await queryPromise;
	if (!Array.isArray(rows)) return [];
	if (!isPacketArray(rows)) return [];
	return rows as any;
};
