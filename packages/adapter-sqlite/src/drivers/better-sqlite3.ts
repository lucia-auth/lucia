import { helper, getSetArgs } from "../utils.js";

import type {
	SessionSchema,
	Adapter,
	InitializeAdapter,
	UserSchema,
	KeySchema
} from "lucia";
import type { Database, SqliteError } from "better-sqlite3";

type BetterSQLiteError = InstanceType<SqliteError>;

export const betterSqlite3 = (db: Database): InitializeAdapter<Adapter> => {
	const transaction = <_Query extends () => any>(query: _Query): void => {
		try {
			db.exec("BEGIN TRANSACTION");
			const result = query();
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
		return {
			getUser: async (userId) => {
				const result: UserSchema | undefined = db
					.prepare(`SELECT * FROM auth_user WHERE id = ?`)
					.get(userId);
				return result ?? null;
			},
			setUser: async (user, key) => {
				const insertUser = () => {
					const [userFields, userValues, userArgs] = helper(user);
					db.prepare(
						`INSERT INTO auth_user ( ${userFields} ) VALUES ( ${userValues} )`
					).run(...userArgs);
				};
				if (!key) return insertUser();
				try {
					transaction(() => {
						insertUser();
						const [keyFields, keyValues, keyArgs] = helper(key);
						db.prepare(
							`INSERT INTO auth_key ( ${keyFields} ) VALUES ( ${keyValues} )`
						).run(...keyArgs);
					});
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
			deleteUser: async (userId) => {
				db.prepare(`DELETE FROM auth_user WHERE id = ?`).run(userId);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				db.prepare(
					`UPDATE auth_user SET ${getSetArgs(fields, values)} WHERE id = ?`
				).run(...args, userId);
			},
			getSession: async (sessionId) => {
				const result: SessionSchema | undefined = db
					.prepare("SELECT * FROM auth_session WHERE id = ?")
					.get(sessionId);
				return result ?? null;
			},
			getSessionsByUserId: async (userId) => {
				const result: SessionSchema[] = db
					.prepare("SELECT * FROM auth_session WHERE user_id = ?")
					.all(userId);
				return result;
			},
			setSession: async (session) => {
				try {
					const [fields, values, args] = helper(session);
					db.prepare(
						`INSERT INTO auth_session ( ${fields} ) VALUES ( ${values} )`
					).run(...args);
				} catch (e) {
					const error = e as Partial<BetterSQLiteError>;
					if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					throw e;
				}
			},
			deleteSession: async (sessionId) => {
				db.prepare(`DELETE FROM auth_session WHERE id = ?`).run(sessionId);
			},
			deleteSessionsByUserId: async (userId) => {
				db.prepare(`DELETE FROM auth_session WHERE user_id = ?`).run(userId);
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				db.prepare(
					`UPDATE auth_session SET ${getSetArgs(fields, values)} WHERE id = ?`
				).run(...args, sessionId);
			},

			getKey: async (keyId) => {
				const result: KeySchema | undefined = db
					.prepare("SELECT * FROM auth_key WHERE id = ?")
					.get(keyId);
				return result ?? null;
			},
			getKeysByUserId: async (userId) => {
				const result: KeySchema[] = db
					.prepare("SELECT * FROM auth_key WHERE user_id = ?")
					.all(userId);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					db.prepare(
						`INSERT INTO auth_key ( ${fields} ) VALUES ( ${values} )`
					).run(...args);
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
			deleteKey: async (keyId) => {
				db.prepare(`DELETE FROM auth_key WHERE id = ?`).run(keyId);
			},
			deleteKeysByUserId: async (userId) => {
				db.prepare(`DELETE FROM auth_key WHERE user_id = ?`).run(userId);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				db.prepare(
					`UPDATE auth_key SET ${getSetArgs(fields, values)} WHERE id = ?`
				).run(...args, keyId);
			}
		};
	};
};
