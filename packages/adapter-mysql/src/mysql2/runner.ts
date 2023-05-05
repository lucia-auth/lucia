import type { Pool } from "mysql2/promise";
import type { Runner } from "../query.js";

export const mysql2Runner = (pool: Pool): Runner => {
	return {
		get: async (query, params) => {
			const [rows] = await pool.query(query, params);
			return rows;
		},
		run: async (query, params) => {
			await pool.query(query, params);
		}
	};
};
