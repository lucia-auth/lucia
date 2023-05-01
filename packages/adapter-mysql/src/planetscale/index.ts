import {
	createSessionAdapter,
	createSessionQueryHelper,
	createUserAdapter,
	createUserQueryHelper
} from "../core.js";
import { planetscaleRunner } from "./runner.js";
import { createOperator } from "../query.js";

import type { Connection, DatabaseError } from "@planetscale/database";
import type { Adapter, AdapterFunction } from "lucia-auth";
import { SessionAdapter, UserAdapter } from "lucia-auth";
import { MySQLUserSchema, transformDatabaseSession } from "../utils";

export const planetscaleUserAdapter = (
	connection: Connection
): AdapterFunction<UserAdapter> => {
	return (LuciaError) => {
		const operator = createOperator(planetscaleRunner(connection));
		const userAdapter = createUserAdapter(operator);
		const helper = createUserQueryHelper(operator);

		return {
			...userAdapter,
			setUser: async (userId, attributes, key) => {
				try {
					if (key) {
						await connection.transaction(async () => {
							await helper.insertUser(userId, attributes);
							await helper.insertKey(key);
						});
						return;
					}
					await helper.insertUser(userId, attributes);
					return;
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			setKey: async (key) => {
				try {
					const user = await helper.getUser(key.user_id);
					if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
					await helper.insertKey(key);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			}
		};
	};
};

export const planetscaleSessionAdapter = (
	connection: Connection
): AdapterFunction<SessionAdapter> => {
	return (LuciaError) => {
		const operator = createOperator(planetscaleRunner(connection));
		const sessionAdapter = createSessionAdapter(operator);
		const helper = createSessionQueryHelper(operator);

		return {
			...sessionAdapter,
			setSession: async (session) => {
				try {
					await helper.insertSession(session);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.body?.message.includes("AlreadyExists") &&
						error.body?.message.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw e;
				}
			}
		};
	};
};

export const planetscaleAdapter = (
	connection: Connection
): AdapterFunction<Adapter> => {
	return (LuciaError) => {
		const operator = createOperator(planetscaleRunner(connection));
		const helper = createUserQueryHelper(operator);
		const userAdapterInstance = planetscaleUserAdapter(connection)(LuciaError);
		const sessionAdapterInstance =
			planetscaleSessionAdapter(connection)(LuciaError);

		return {
			...userAdapterInstance,
			...sessionAdapterInstance,
			getSessionAndUserBySessionId: async (sessionId) => {
				const data = await operator.get<
					MySQLUserSchema & {
						_session_active_expires: number;
						_session_id: string;
						_session_idle_expires: number;
						_session_user_id: string;
					}
				>((ctx) => [
					ctx.selectFrom(
						"auth_session",
						"auth_user.*",
						"auth_session.id as _session_id",
						"auth_session.active_expires as _session_active_expires",
						"auth_session.idle_expires as _session_idle_expires",
						"auth_session.user_id as _session_user_id"
					),
					ctx.innerJoin("auth_user", "auth_user.id", "auth_session.user_id"),
					ctx.where("auth_session.id", "=", sessionId)
				]);
				if (!data) return null;
				const {
					_session_active_expires,
					_session_id,
					_session_idle_expires,
					_session_user_id,
					...user
				} = data;
				return {
					user,
					session: transformDatabaseSession({
						id: _session_id,
						user_id: _session_user_id,
						active_expires: _session_active_expires,
						idle_expires: _session_idle_expires
					})
				};
			},
			// NOTE: we override the setSession method here to ensure that the user exists
			setSession: async (session) => {
				const user = await helper.getUser(session.user_id);
				if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
				await sessionAdapterInstance.setSession(session);
			}
		};
	};
};
