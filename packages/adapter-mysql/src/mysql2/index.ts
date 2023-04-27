import { mysql2Runner } from "./runner.js";
import { createCoreAdapter, createQueryHelper } from "../core.js";
import { createOperator } from "../query.js";

import type { Adapter, AdapterFunction } from "lucia-auth";
import type { Pool, QueryError } from "mysql2/promise";

export const mysql2Adapter = (db: Pool): AdapterFunction<Adapter> => {
	const transaction = async <_Execute extends () => Promise<any>>(
		execute: _Execute
	) => {
		const connection = await db.getConnection();
		try {
			await connection.beginTransaction();
			await execute();
			await connection.commit();
			return;
		} catch (e) {
			await connection.rollback();
			throw e;
		}
	};

	return (LuciaError) => {
		const operator = createOperator(mysql2Runner(db));
		const coreAdapter = createCoreAdapter(operator);
		const helper = createQueryHelper(operator);
		return {
			...coreAdapter,
			setUser: async (userId, attributes, key) => {
				try {
					if (key) {
						await transaction(async () => {
							await helper.insertUser(userId, attributes);
							await helper.insertKey(key);
						});
						return;
					}
					await helper.insertUser(userId, attributes);
				} catch (e) {
					const error = e as Partial<QueryError>;
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
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
					const error = e as Partial<QueryError>;
					if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
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
					const error = e as Partial<QueryError>;
					if (error.errno === 1452 && error.message?.includes("(`user_id`)")) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.code === "ER_DUP_ENTRY" &&
						error.message?.includes("PRIMARY")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			}
		};
	};
};
