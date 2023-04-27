import { createCoreAdapter } from "../core.js";
import { planetscaleRunner } from "./runner.js";
import { createOperator } from "../query.js";

import type { Connection, DatabaseError } from "@planetscale/database";
import type { Adapter, AdapterFunction } from "lucia-auth";
import type { MySQLUserSchema } from "../utils.js";

export const planetscaleAdapter = (
	connection: Connection
): AdapterFunction<Adapter> => {
	return (LuciaError) => {
		const operator = createOperator(planetscaleRunner(connection));
		const coreAdapter = createCoreAdapter(operator);
		return {
			getUser: coreAdapter.getUser,
			getSessionAndUserBySessionId: coreAdapter.getSessionAndUserBySessionId,
			getSession: coreAdapter.getSession,
			getSessionsByUserId: coreAdapter.getSessionsByUserId,
			setUser: async (userId, attributes, key) => {
				try {
					const user = {
						id: userId,
						...attributes
					};
					if (key) {
						await connection.transaction(async (trx) => {
							const trxOperator = createOperator(planetscaleRunner(trx));
							await trxOperator.run<MySQLUserSchema>((ctx) => [
								ctx.insertInto("auth_user", user)
							]);
							await trxOperator.run((ctx) => [ctx.insertInto("auth_key", key)]);
						});
						return;
					}
					await operator.run<MySQLUserSchema>((ctx) => [
						ctx.insertInto("auth_user", user)
					]);
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
			deleteUser: coreAdapter.deleteUser,
			setSession: async (session) => {
				try {
					const databaseUser = await operator.get((ctx) => [
						ctx.selectFrom("auth_user", "*"),
						ctx.where("id", "=", session.user_id)
					]);
					if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
					return await coreAdapter.setSession(session);
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
			},
			deleteSession: coreAdapter.deleteSession,
			deleteSessionsByUserId: coreAdapter.deleteSessionsByUserId,
			updateUserAttributes: coreAdapter.updateUserAttributes,
			setKey: async (key) => {
				try {
					const databaseUser = await operator.get((ctx) => [
						ctx.selectFrom("auth_user", "*"),
						ctx.where("id", "=", key.user_id)
					]);
					if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
					return await coreAdapter.setKey(key);
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
			getKey: coreAdapter.getKey,
			getKeysByUserId: coreAdapter.getKeysByUserId,
			updateKeyPassword: coreAdapter.updateKeyPassword,
			deleteKeysByUserId: coreAdapter.deleteKeysByUserId,
			deleteNonPrimaryKey: coreAdapter.deleteNonPrimaryKey
		};
	};
};
