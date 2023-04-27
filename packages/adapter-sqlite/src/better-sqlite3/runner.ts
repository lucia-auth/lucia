import type { Runner } from "../query.js";
import type { Database } from "better-sqlite3";

export const betterSqliteRunner = (db: Database): Runner => {
	return {
		get: async (query, params) => {
			return db.prepare(query).get(params);
		},
		run: async (query, params) => {
			db.prepare(query).run(params);
		}
	};
};
