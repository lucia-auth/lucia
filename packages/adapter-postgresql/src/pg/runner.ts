import type { Runner } from "../query.js";
import type { Pool } from "./types.js";

export const pgRunner = (pool: Pool): Runner => {
	return {
		get: async (query, params) => {
			const result = await pool.query(query, params);
			return result.rows;
		},
		run: async (query, params) => {
			await pool.query(query, params);
		}
	};
};
