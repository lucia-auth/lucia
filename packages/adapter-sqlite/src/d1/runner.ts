import type { Runner } from "../query.js";
import type { D1Database } from "@cloudflare/workers-types";

export const d1Runner = (db: D1Database): Runner => {
	return {
		get: async (query, params) => {
			const result = await db
				.prepare(query)
				.bind(...params)
				.all();
			if (result.error) throw result.error;
			return result.results ?? [];
		},
		run: async (query, params) => {
			const result = await db
				.prepare(query)
				.bind(...params)
				.run();
			if (result.error) throw result.error;
		}
	};
};
