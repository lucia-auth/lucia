import type { Pool } from "mysql2/promise";
import type { AsyncRunner } from "../query.js";

export const mysql2Runner = (pool: Pool): AsyncRunner => {
	return {
		type: "async",
		get: async (query, params) => {
			const [rows] = await pool.query(query, params);
			return rows;
		},
		run: async (query, params) => {
			await pool.query(query, params);
		},
		transaction: async (execute) => {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				const result = await execute();
				await connection.commit();
				return result;
			} catch (e) {
				await connection.rollback();
				throw e;
			}
		}
	};
};
