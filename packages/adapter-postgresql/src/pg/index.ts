import { createOperator } from "../query.js";
import { pgRunner } from "./runner.js";
import { createCoreAdapter, createQueryHelper } from "../core.js";

import type { Adapter, AdapterFunction } from "lucia-auth";
import type { Pool, DatabaseError } from "./types.js";

export const pgAdapter = (pool: Pool): AdapterFunction<Adapter> => {
	const transaction = async <_Execute extends () => Promise<any>>(
		execute: _Execute
	): Promise<Awaited<ReturnType<_Execute>>> => {
		const connection = await pool.connect();
		try {
			await connection.query("BEGIN");
			const result = await execute();
			await connection.query("COMMIT");
			return result;
		} catch (e) {
			connection.query("ROLLBACK");
			throw e;
		}
	};

	return (LuciaError) => {
		const operator = createOperator(pgRunner(pool));
		const coreAdapter = createCoreAdapter(operator);
		const helper = createQueryHelper(operator);
		return {
			...coreAdapter,
			setUser: async (userId, attributes, key) => {
				try {
					if (key) {
						const insertedUser = await transaction(async () => {
							const databaseUser = await helper.insertUser(userId, attributes);
							if (!databaseUser) throw new TypeError("Unexpected query result");
							await helper.insertKey(key);
							return databaseUser;
						});
						return insertedUser;
					}
					const insertedUser = await helper.insertUser(userId, attributes);
					if (!insertedUser) throw new TypeError("Unexpected type");
					return insertedUser;
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}
			},
			setSession: async (session) => {
				try {
					await helper.insertSession(session);
				} catch (e) {
					const error = e as Partial<DatabaseError>;
					if (
						error.code === "23503" &&
						error.detail?.includes("Key (user_id)")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (error.code === "23505" && error.detail?.includes("Key (id)")) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw e;
				}
			},
			updateUserAttributes: async (userId, attributes) => {
				if (Object.keys(attributes).length === 0) {
					const databaseUser = await helper.getUser(userId);
					if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
					return databaseUser;
				}
				const updatedUser = await helper.updateUserAttributes(
					userId,
					attributes
				);
				if (!updatedUser) throw new LuciaError("AUTH_INVALID_USER_ID");
				return updatedUser;
			},
			setKey: async (key) => {
				try {
					await helper.insertKey(key);
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
					throw error;
				}
			},
			updateKeyPassword: async (keyId, hashedPassword) => {
				const updatedKey = await helper.updateKeyPassword(
					keyId,
					hashedPassword
				);
				if (!updatedKey) throw new LuciaError("AUTH_INVALID_KEY_ID");
				return updatedKey;
			}
		};
	};
};
