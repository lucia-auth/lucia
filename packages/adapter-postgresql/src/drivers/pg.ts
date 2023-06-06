import pg from "pg";
import { helper, getSetArgs } from "../utils.js";

import type {
	Adapter,
	InitializeAdapter,
	UserSchema,
	SessionSchema,
	KeySchema
} from "lucia";
import type {
	QueryResult,
	DatabaseError,
	Pool,
	PoolClient,
	QueryResultRow
} from "pg";

export const pgAdapter = (pool: Pool): InitializeAdapter<Adapter> => {
	const transaction = async (
		execute: (connection: PoolClient) => Promise<any>
	): Promise<void> => {
		const connection = await pool.connect();
		try {
			await connection.query("BEGIN");
			await execute(connection);
			await connection.query("COMMIT");
		} catch (e) {
			connection.query("ROLLBACK");
			throw e;
		}
	};

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const result = await get<UserSchema>(
					pool.query("SELECT * FROM auth_user WHERE id = $1", [userId])
				);
				return result;
			},
			setUser: async (user, key) => {
				if (!key) {
					const [userFields, userValues, userArgs] = helper(user);
					await pool.query(
						`INSERT INTO auth_user ( ${userFields} ) VALUES ( ${userValues} )`,
						userArgs
					);
					return;
				}
				try {
					await transaction(async (tx) => {
						const [userFields, userValues, userArgs] = helper(user);
						await tx.query(
							`INSERT INTO auth_user ( ${userFields} ) VALUES ( ${userValues} )`,
							userArgs
						);
						const [keyFields, keyValues, keyArgs] = helper(key);
						await tx.query(
							`INSERT INTO auth_key ( ${keyFields} ) VALUES ( ${keyValues} )`,
							keyArgs
						);
					});
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await pool.query(`DELETE FROM auth_user WHERE id = $1`, [userId]);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await pool.query(
					`UPDATE auth_user SET ${getSetArgs(fields, values)} WHERE id = $${
						fields.length + 1
					}`,
					[...args, userId]
				);
			},

			getSession: async (sessionId) => {
				const result = await get<PgSession>(
					pool.query("SELECT * FROM auth_session WHERE id = $1", [sessionId])
				);
				return result ? transformPgSession(result) : null;
			},
			getSessionsByUserId: async (userId) => {
				const result = await getAll<PgSession>(
					pool.query("SELECT * FROM auth_session WHERE user_id = $1", [userId])
				);
				return result.map((val) => transformPgSession(val));
			},
			setSession: async (session) => {
				try {
					const [fields, values, args] = helper(session);
					await pool.query(
						`INSERT INTO auth_session ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
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
				await pool.query(`DELETE FROM auth_session WHERE id = $1`, [sessionId]);
			},
			deleteSessionsByUserId: async (userId) => {
				await pool.query(`DELETE FROM auth_session WHERE user_id = $1`, [
					userId
				]);
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				await pool.query(
					`UPDATE auth_session SET ${getSetArgs(fields, values)} WHERE id = $${
						fields.length + 1
					}`,
					[...args, sessionId]
				);
			},

			getKey: async (keyId) => {
				const result = await get(
					pool.query<KeySchema>("SELECT * FROM auth_key WHERE id = $1", [keyId])
				);
				return result;
			},
			getKeysByUserId: async (userId) => {
				const result = getAll<KeySchema>(
					pool.query("SELECT * FROM auth_key WHERE user_id = $1", [userId])
				);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await pool.query(
						`INSERT INTO auth_key ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
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
				await pool.query(`DELETE FROM auth_key WHERE id = $1`, [keyId]);
			},
			deleteKeysByUserId: async (userId) => {
				await pool.query(`DELETE FROM auth_key WHERE user_id = $1`, [userId]);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await pool.query(
					`UPDATE auth_key SET ${getSetArgs(fields, values)} WHERE id = $${
						fields.length + 1
					}`,
					[...args, keyId]
				);
			}
		};
	};
};

export const get = async <_Schema extends QueryResultRow>(
	queryPromise: Promise<QueryResult<_Schema>>
): Promise<_Schema | null> => {
	const { rows } = await queryPromise;
	const result = rows.at(0) ?? null;
	return result;
};

export const getAll = async <_Schema extends QueryResultRow>(
	queryPromise: Promise<QueryResult<_Schema>>
): Promise<_Schema[]> => {
	const { rows } = await queryPromise;
	return rows;
};

export type PgSession = Omit<
	SessionSchema,
	"active_expires" | "idle_expires"
> & {
	active_expires: BigInt;
	idle_expires: BigInt;
};

export const transformPgSession = (session: PgSession): SessionSchema => {
	return {
		...session,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};
