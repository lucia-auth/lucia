import { helper, getSetArgs, escapeName } from "../utils.js";

import type {
	SessionSchema,
	Adapter,
	InitializeAdapter,
	UserSchema,
	KeySchema
} from "lucia";
import type { Client, LibsqlError } from "@libsql/client";

export const libsqlAdapter = (
	db: Client,
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
				const result = await db.execute({
					sql: `SELECT * FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`,
					args: [userId]
				});
				const rows = result.rows as unknown[] as UserSchema[];
				return rows.at(0) ?? null;
			},
			setUser: async (user, key) => {
				const [userFields, userValues, userArgs] = helper(user);
				const insertUserQuery = {
					sql: `INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
					args: userArgs
				};
				if (!key) {
					await db.execute(insertUserQuery);
					return;
				}
				try {
					const [keyFields, keyValues, keyArgs] = helper(key);
					const insertKeyQuery = {
						sql: `INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${keyFields} ) VALUES ( ${keyValues} )`,
						args: keyArgs
					};
					await db.batch([insertUserQuery, insertKeyQuery], "write");
				} catch (e) {
					const error = e as Partial<LibsqlError>;
					if (
						error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
						error.message?.includes(".id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await db.execute({
					sql: `DELETE FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`,
					args: [userId]
				});
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				args.push(userId);
				await db.execute({
					sql: `UPDATE ${ESCAPED_USER_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					args
				});
			},

			getSession: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const result = await db.execute({
					sql: `SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					args: [sessionId]
				});
				const rows = result.rows as unknown[] as SessionSchema[];
				return rows.at(0) ?? null;
			},
			getSessionsByUserId: async (userId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const result = await db.execute({
					sql: `SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
					args: [userId]
				});
				return result.rows as unknown[] as SessionSchema[];
			},
			setSession: async (session) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				try {
					const [fields, values, args] = helper(session);
					await db.execute({
						sql: `INSERT INTO ${ESCAPED_SESSION_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					});
				} catch (e) {
					const error = e as Partial<LibsqlError>;
					if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				await db.execute({
					sql: `DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					args: [sessionId]
				});
			},
			deleteSessionsByUserId: async (userId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				await db.execute({
					sql: `DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
					args: [userId]
				});
			},
			updateSession: async (sessionId, partialSession) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const [fields, values, args] = helper(partialSession);
				const setArgs = getSetArgs(fields, values);
				args.push(sessionId);
				await db.execute({
					sql: `UPDATE ${ESCAPED_SESSION_TABLE_NAME} SET ${setArgs} WHERE id = ?`,
					args
				});
			},

			getKey: async (keyId) => {
				const result = await db.execute({
					sql: `SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`,
					args: [keyId]
				});
				const rows = result.rows as unknown[] as KeySchema[];
				return rows.at(0) ?? null;
			},
			getKeysByUserId: async (userId) => {
				const result = await db.execute({
					sql: `SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
					args: [userId]
				});
				return result.rows as unknown[] as KeySchema[];
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await db.execute({
						sql: `INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						args
					});
				} catch (e) {
					const error = e as Partial<LibsqlError>;
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
			deleteKey: async (keyId) => {
				await db.execute({
					sql: `DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`,
					args: [keyId]
				});
			},
			deleteKeysByUserId: async (userId) => {
				await db.execute({
					sql: `DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
					args: [userId]
				});
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				const setArgs = getSetArgs(fields, values);
				args.push(keyId);
				await db.execute({
					sql: `UPDATE ${ESCAPED_KEY_TABLE_NAME} SET ${setArgs} WHERE id = ?`,
					args
				});
			}
		};
	};
};
