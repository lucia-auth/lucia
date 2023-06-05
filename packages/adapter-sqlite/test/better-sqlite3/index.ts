import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { db } from "../db.js";
import { betterSqlite3 as betterSqlite3Adapter } from "../../src/index.js";
import { helper } from "../../src/utils.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	return {
		get: async () => {
			return db.prepare(`SELECT * FROM ${tableName}`).all();
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			db.prepare(
				`INSERT INTO ${tableName} ( ${fields} ) VALUES ( ${placeholders} )`
			).run(...args);
		},
		clear: async () => {
			db.exec(`DELETE FROM ${tableName}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler("auth_user"),
	session: createTableQueryHandler("auth_session"),
	key: createTableQueryHandler("auth_key")
};

const adapter = betterSqlite3Adapter(db)(LuciaError);

testAdapter(adapter, new Database(queryHandler));
