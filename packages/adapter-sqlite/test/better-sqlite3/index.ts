import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { TABLE_NAMES, db } from "../db.js";
import { betterSqlite3Adapter } from "../../src/drivers/better-sqlite3.js";
import { escapeName, helper } from "../../src/utils.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return db.prepare(`SELECT * FROM ${ESCAPED_TABLE_NAME}`).all();
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			db.prepare(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`
			).run(...args);
		},
		clear: async () => {
			db.exec(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: createTableQueryHandler(TABLE_NAMES.session),
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = betterSqlite3Adapter(db, TABLE_NAMES)(LuciaError);

testAdapter(adapter, new Database(queryHandler));
