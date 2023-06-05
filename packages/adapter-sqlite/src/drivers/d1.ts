import { helper, getSetArgs } from "../utils.js";

import type {
	SessionSchema,
	Adapter,
	InitializeAdapter,
	UserSchema,
	KeySchema
} from "lucia";
import type { D1Database } from "@cloudflare/workers-types";

export const d1 = (db: D1Database): InitializeAdapter<Adapter> => {
	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const user = await db
					.prepare(`SELECT * FROM auth_user WHERE id = ?`)
					.bind(userId)
					.first<UserSchema | null>();
				return user;
			},
			setUser: async (user, key) => {
				const [userFields, userValues, userArgs] = helper(user);
				const insertUserStatement = db
					.prepare(
						`INSERT INTO auth_user ( ${userFields} ) VALUES ( ${userValues} )`
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
							`INSERT INTO auth_key ( ${keyFields} ) VALUES ( ${keyValues} )`
						)
						.bind(...keyArgs);
					await db.batch([insertUserStatement, insertKeyStatement]);
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
			deleteUser: async (userId) => {
				await db
					.prepare(`DELETE FROM auth_user WHERE id = ?`)
					.bind(userId)
					.run();
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await db
					.prepare(
						`UPDATE auth_user SET ${getSetArgs(fields, values)} WHERE id = ?`
					)
					.bind(...args, userId)
					.run();
			},

			getSession: async (sessionId) => {
				const session = await db
					.prepare("SELECT * FROM auth_session WHERE id = ?")
					.bind(sessionId)
					.first<SessionSchema | null>();
				return session;
			},
			getSessionsByUserId: async (userId) => {
				const { results: sessionResults } = await db
					.prepare("SELECT * FROM auth_session WHERE user_id = ?")
					.bind(userId)
					.all<SessionSchema>();
				return sessionResults ?? [];
			},
			setSession: async (session) => {
				try {
					const [fields, values, args] = helper(session);
					await db
						.prepare(
							`INSERT INTO auth_session ( ${fields} ) VALUES ( ${values} )`
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
					.prepare(`DELETE FROM auth_session WHERE id = ?`)
					.bind(sessionId)
					.run();
			},
			deleteSessionsByUserId: async (userId) => {
				await db
					.prepare(`DELETE FROM auth_session WHERE user_id = ?`)
					.bind(userId)
					.run();
			},
			updateSession: async (sessionId, partialSession) => {
				const [fields, values, args] = helper(partialSession);
				await db
					.prepare(
						`UPDATE auth_session SET ${getSetArgs(fields, values)} WHERE id = ?`
					)
					.bind(...args, sessionId)
					.run();
			},

			getKey: async (keyId) => {
				const key = await db
					.prepare("SELECT * FROM auth_key WHERE id = ?")
					.bind(keyId)
					.first<KeySchema | null>();
				return key;
			},
			getKeysByUserId: async (userId) => {
				const { results: keyResults } = await db
					.prepare("SELECT * FROM auth_key WHERE user_id = ?")
					.bind(userId)
					.all<KeySchema>();
				return keyResults ?? [];
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await db
						.prepare(`INSERT INTO auth_key ( ${fields} ) VALUES ( ${values} )`)
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
						error.cause?.message?.includes("auth_key.id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			deleteKey: async (keyId) => {
				await db.prepare(`DELETE FROM auth_key WHERE id = ?`).bind(keyId).run();
			},
			deleteKeysByUserId: async (userId) => {
				await db
					.prepare(`DELETE FROM auth_key WHERE user_id = ?`)
					.bind(userId)
					.run();
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await db
					.prepare(
						`UPDATE auth_key SET ${getSetArgs(fields, values)} WHERE id = ?`
					)
					.bind(...args, keyId)
					.run();
			},

			getSessionAndUser: async (sessionId) => {
				const getSessionStatement = db
					.prepare(`SELECT * FROM auth_session WHERE id = ?`)
					.bind(sessionId);
				const getUserFromJoinStatement = db
					.prepare(
						`SELECT auth_user.*, auth_session.id as _auth_session_id FROM auth_session INNER JOIN auth_user ON auth_user.id = auth_session.user_id WHERE auth_session.id = ?`
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
								_auth_session_id: string;
							}
						>
					];
				const session = sessionResults?.at(0) ?? null;
				const userFromJoin = userFromJoinResults?.at(0) ?? null;
				if (!session || !userFromJoin) return [null, null];
				const { _auth_session_id: _, ...user } = userFromJoin;
				return [session, user];
			}
		};
	};
};
