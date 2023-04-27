import type { Connection } from "@planetscale/database";
import type { Runner } from "../query.js";

export const planetscaleRunner = (
	connection: Pick<Connection, "execute">
): Runner => {
	return {
		get: async (query, params) => {
			const { rows } = await connection.execute(query, params);
			return rows;
		},
		run: async (query, params) => {
			await connection.execute(query, params);
		}
	};
};
