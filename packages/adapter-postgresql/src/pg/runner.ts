import type { AsyncRunner } from "../query.js";
import type { Pool } from "./types.js";

export const pgRunner = (pool: Pool): AsyncRunner => {
	return {
		type: "async",
		get: async (query, params) => {
			const result = await pool.query(query, params);
			return result.rows;
		},
		run: async (query, params) => {
			console.log(query, params);
			await pool.query(query, params);
		},
		transaction: async (execute) => {
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
		}
	};
};
