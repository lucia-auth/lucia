import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { TABLE_NAMES } from "../db.js";
import { libsqlAdapter } from "../../src/drivers/libsql.js";
import { escapeName, helper } from "../../src/utils.js";
import { createClient } from "@libsql/client";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const db = createClient({
	url: "file:test/main.db"
});

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			const { rows } = await db.execute(`SELECT * FROM ${ESCAPED_TABLE_NAME}`);
			return rows;
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await db.execute({
				sql: `INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			});
		},
		clear: async () => {
			await db.execute(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: createTableQueryHandler(TABLE_NAMES.session),
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = libsqlAdapter(db, TABLE_NAMES)(LuciaError);

testAdapter(adapter, new Database(queryHandler));
