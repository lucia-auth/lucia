import type { SyncRunner } from "../query.js";
import type { Database } from "better-sqlite3";

export const betterSqliteRunner = (db: Database): SyncRunner => {
	return {
		type: "sync",
		get: (query, params) => {
			return db.prepare(query).get(params);
		},
		run: (query, params) => {
			db.prepare(query).run(params);
		},
		transaction: <_Execute>(execute: Function) => {
			try {
				db.exec("BEGIN TRANSACTION");
				const result = execute();
				db.exec("COMMIT");
				return result;
			} catch (e) {
				if (db.inTransaction) {
					db.exec("ROLLBACK");
				}
				throw e;
			}
		}
	};
};
