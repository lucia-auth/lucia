import { createCoreAdapter, createQueryHelper } from "../core.js";
import { planetscaleRunner } from "./runner.js";
import { createOperator } from "../query.js";

import type { Connection, DatabaseError } from "@planetscale/database";
import type { Adapter, AdapterFunction } from "lucia-auth";

export const planetscaleAdapter = (
	connection: Connection
): AdapterFunction<Adapter> => {
	return (LuciaError) => {
		const operator = createOperator(planetscaleRunner(connection));
		const coreAdapter = createCoreAdapter(operator);
		const helper = createQueryHelper(operator);
		return {
			...coreAdapter,
			setUser: async (userId, attributes, key) => {
				try {
					if (key) {
						await connection.transaction(async (trx) => {
							const trxOperator = createOperator(planetscaleRunner(trx));
							const trxHelper = createQueryHelper(trxOperator);
							await trxHelper.insertUser(userId, attributes);
							await trxHelper.insertKey(key);
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
			setSession: async (session) => {
				try {
					const user = await helper.getUser(session.user_id);
					if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
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
