import { getSetArgs, helper } from "../utils.js";

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
	connection: Connection
): InitializeAdapter<Adapter> => {
	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const result = await get<UserSchema>(
					connection.execute("SELECT * FROM auth_user WHERE id = ?", [userId])
				);
				return result;
			},
			setUser: async (user, key) => {
				if (!key) {
					const [userFields, userValues, userArgs] = helper(user);
					await connection.execute(
						`INSERT INTO auth_user ( ${userFields} ) VALUES ( ${userValues} )`,
						userArgs
					);
					return;
				}
				try {
					await connection.transaction(async (tx) => {
						const [userFields, userValues, userArgs] = helper(user);
						await tx.execute(
							`INSERT INTO auth_user ( ${userFields} ) VALUES ( ${userValues} )`,
							userArgs
						);
						const [keyFields, keyValues, keyArgs] = helper(key);
						await tx.execute(
							`INSERT INTO auth_key ( ${keyFields} ) VALUES ( ${keyValues} )`,
							keyArgs
						);
					});
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY") &&
						error.body?.message.includes("auth_key")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteUser: async (userId) => {
				await connection.execute(`DELETE FROM auth_user WHERE id = ?`, [
					userId
				]);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await connection.execute(
					`UPDATE auth_user SET ${getSetArgs(fields, values)} WHERE id = ?`,
					[...args, userId]
				);
			},

			getSession: async (sessionId) => {
				const result = await get<PlanetscaleSessionSchema>(
					connection.execute("SELECT * FROM auth_session WHERE id = ?", [
						sessionId
					])
				);
				return result ? transformDatabaseSessionResult(result) : null;
			},
			getSessionsByUserId: async (userId) => {
				const result = await getAll<PlanetscaleSessionSchema>(
					connection.execute("SELECT * FROM auth_session WHERE user_id = ?", [
						userId
					])
				);
				return result.map((val) => transformDatabaseSessionResult(val));
			},
			setSession: async (session) => {
				const [fields, values, args] = helper(session);
				await connection.execute(
					`INSERT INTO auth_session ( ${fields} ) VALUES ( ${values} )`,
					args
				);
			},
			deleteSession: async (sessionId) => {
				await connection.execute(`DELETE FROM auth_session WHERE id = ?`, [
					sessionId
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				await connection.execute(`DELETE FROM auth_session WHERE user_id = ?`, [
					userId
				]);
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				await connection.execute(
					`UPDATE auth_session SET ${getSetArgs(fields, values)} WHERE id = ?`,
					[...args, sessionId]
				);
			},

			getKey: async (keyId) => {
				const result = await get<KeySchema>(
					connection.execute("SELECT * FROM auth_key WHERE id = ?", [keyId])
				);
				return result;
			},
			getKeysByUserId: async (userId) => {
				const result = getAll<KeySchema>(
					connection.execute("SELECT * FROM auth_key WHERE user_id = ?", [
						userId
					])
				);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await connection.execute(
						`INSERT INTO auth_key ( ${fields} ) VALUES ( ${values} )`,
						args
					);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY") &&
						error.body?.message.includes("auth_key")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteKey: async (keyId) => {
				await connection.execute(`DELETE FROM auth_key WHERE id = ?`, [keyId]);
			},
			deleteKeysByUserId: async (userId) => {
				await connection.execute(`DELETE FROM auth_key WHERE user_id = ?`, [
					userId
				]);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await connection.execute(
					`UPDATE auth_key SET ${getSetArgs(fields, values)} WHERE id = ?`,
					[...args, keyId]
				);
			},
			getSessionAndUser: async (sessionId) => {
				const [sessionResult, userFromJoinResult] = await Promise.all([
					get<PlanetscaleSessionSchema>(
						connection.execute("SELECT * FROM auth_session WHERE id = ?", [
							sessionId
						])
					),
					get<
						UserSchema & {
							_auth_session_id: string;
						}
					>(
						connection.execute(
							"SELECT auth_user.*, auth_session.id as _auth_session_id FROM auth_session INNER JOIN auth_user ON auth_user.id = auth_session.user_id WHERE auth_session.id = ?",
							[sessionId]
						)
					)
				]);
				if (!sessionResult || !userFromJoinResult) return [null, null];
				const { _auth_session_id: _, ...userResult } = userFromJoinResult;
				return [transformDatabaseSessionResult(sessionResult), userResult];
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

export type PlanetscaleSessionSchema = Omit<
	SessionSchema,
	"active_expires" | "idle_expires"
> & {
	active_expires: BigInt;
	idle_expires: BigInt;
};

export const transformDatabaseSessionResult = (
	session: PlanetscaleSessionSchema
): SessionSchema => {
	return {
		...session,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};
