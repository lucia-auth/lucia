import { helper, getSetArgs, escapeName } from "../utils.js";

import type {
	SessionSchema,
	Adapter,
	InitializeAdapter,
	UserSchema,
	KeySchema
} from "lucia";

type PrismaError = {
	meta: {
		code: string;
		message: string;
	};
};

export const prismaAdapter = <
	_AdapterParameterPrismaClient extends AdapterParameterPrismaClient
>(
	client: _AdapterParameterPrismaClient,
	tables: {
		user: string;
		session: string;
		key: string;
	}
): InitializeAdapter<Adapter> => {
	const prismaClient = client as PrismaClient;
	const ESCAPED_USER_TABLE_NAME = escapeName(tables.user);
	const ESCAPED_SESSION_TABLE_NAME = tables.session
		? escapeName(tables.session)
		: null;
	const ESCAPED_KEY_TABLE_NAME = escapeName(tables.key);

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const result = await prismaClient.$queryRawUnsafe<UserSchema>(
					`SELECT * FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`,
					userId
				);
				return result.at(0) ?? null;
			},
			setUser: async (user, key) => {
				const insertUser = () => {
					const [userFields, userValues, userArgs] = helper(user);
					return prismaClient.$executeRawUnsafe(
						`INSERT INTO ${ESCAPED_USER_TABLE_NAME} ( ${userFields} ) VALUES ( ${userValues} )`,
						...userArgs
					);
				};
				if (!key) {
					await insertUser();
					return;
				}
				try {
					const [keyFields, keyValues, keyArgs] = helper(key);
					await prismaClient.$transaction([
						insertUser(),
						prismaClient.$executeRawUnsafe(
							`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${keyFields} ) VALUES ( ${keyValues} )`,
							...keyArgs
						)
					]);
				} catch (e) {
					const error = e as Partial<PrismaError>;
					if (
						error.meta?.code === "1062" &&
						error.meta.message?.includes("'user_key.PRIMARY'")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw error;
				}
			},
			deleteUser: async (userId) => {
				await prismaClient.$executeRawUnsafe(
					`DELETE FROM ${ESCAPED_USER_TABLE_NAME} WHERE id = ?`,
					userId
				);
			},
			updateUser: async (userId, partialUser) => {
				const [fields, values, args] = helper(partialUser);
				await prismaClient.$executeRawUnsafe(
					`UPDATE ${ESCAPED_USER_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					...args,
					userId
				);
			},

			getSession: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const result = await prismaClient.$queryRawUnsafe<SessionSchema>(
					`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					sessionId
				);
				return result.at(0) ?? null;
			},
			getSessionsByUserId: async (userId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const result = await prismaClient.$queryRawUnsafe<SessionSchema>(
					`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
					userId
				);
				return result;
			},
			setSession: async (session) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				try {
					const [fields, values, args] = helper(session);
					await prismaClient.$executeRawUnsafe(
						`INSERT INTO ${ESCAPED_SESSION_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						...args
					);
				} catch (e) {
					const error = e as Partial<PrismaError>;
					if (error.meta?.code === "1452") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				await prismaClient.$executeRawUnsafe(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					sessionId
				);
			},
			deleteSessionsByUserId: async (userId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				await prismaClient.$executeRawUnsafe(
					`DELETE FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE user_id = ?`,
					userId
				);
			},
			updateSession: async (sessionId, partialSession) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const [fields, values, args] = helper(partialSession);
				await prismaClient.$executeRawUnsafe(
					`UPDATE ${ESCAPED_SESSION_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					...args,
					sessionId
				);
			},

			getKey: async (keyId) => {
				const result = await prismaClient.$queryRawUnsafe<KeySchema>(
					`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`,
					keyId
				);
				return result.at(0) ?? null;
			},
			getKeysByUserId: async (userId) => {
				const result = await prismaClient.$queryRawUnsafe<KeySchema>(
					`SELECT * FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
					userId
				);
				return result;
			},
			setKey: async (key) => {
				try {
					const [fields, values, args] = helper(key);
					await prismaClient.$executeRawUnsafe(
						`INSERT INTO ${ESCAPED_KEY_TABLE_NAME} ( ${fields} ) VALUES ( ${values} )`,
						...args
					);
				} catch (e) {
					const error = e as Partial<PrismaError>;
					if (error.meta?.code === "1452") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.meta?.code === "1062" &&
						error.meta.message?.includes("'user_key.PRIMARY'")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw error;
				}
			},
			deleteKey: async (keyId) => {
				await prismaClient.$executeRawUnsafe(
					`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE id = ?`,
					keyId
				);
			},
			deleteKeysByUserId: async (userId) => {
				await prismaClient.$executeRawUnsafe(
					`DELETE FROM ${ESCAPED_KEY_TABLE_NAME} WHERE user_id = ?`,
					userId
				);
			},
			updateKey: async (keyId, partialKey) => {
				const [fields, values, args] = helper(partialKey);
				await prismaClient.$executeRawUnsafe(
					`UPDATE ${ESCAPED_KEY_TABLE_NAME} SET ${getSetArgs(
						fields,
						values
					)} WHERE id = ?`,
					...args,
					keyId
				);
			},

			getSessionAndUser: async (sessionId) => {
				if (!ESCAPED_SESSION_TABLE_NAME) {
					throw new Error("Session table not defined");
				}
				const getSessionPromise = prismaClient.$queryRawUnsafe<SessionSchema>(
					`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME} WHERE id = ?`,
					sessionId
				);
				const getUserFromJoinPromise = prismaClient.$queryRawUnsafe<
					UserSchema & {
						__session_id: string;
					}
				>(
					`SELECT ${ESCAPED_USER_TABLE_NAME}.*, ${ESCAPED_SESSION_TABLE_NAME}.id as __session_id FROM ${ESCAPED_SESSION_TABLE_NAME} INNER JOIN ${ESCAPED_USER_TABLE_NAME} ON ${ESCAPED_USER_TABLE_NAME}.id = ${ESCAPED_SESSION_TABLE_NAME}.user_id WHERE ${ESCAPED_SESSION_TABLE_NAME}.id = ?`,
					sessionId
				);
				const [sessionResults, userFromJoinResults] = await Promise.all([
					getSessionPromise,
					getUserFromJoinPromise
				]);
				const sessionResult = sessionResults.at(0) ?? null;
				const userFromJoinResult = userFromJoinResults.at(0) ?? null;
				if (!sessionResult || !userFromJoinResult) return [null, null];
				const { __session_id: _, ...userResult } = userFromJoinResult;
				return [sessionResult, userResult];
			}
		};
	};
};

type AdapterParameterPrismaClient = {
	$executeRawUnsafe: any;
	$queryRawUnsafe: any;
	$transaction: any;
};

type PrismaClient = {
	$queryRawUnsafe: <T extends {}>(
		query: string,
		...args: string[]
	) => Promise<T[]>;
	$executeRawUnsafe: (query: string, ...args: string[]) => Promise<void>;
	$transaction: (queries: Promise<any>[]) => Promise<void>;
};
