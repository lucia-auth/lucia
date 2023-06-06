import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { pool } from "./db.js";
import { escapeName, helper } from "../../src/utils.js";
import { getAll, mysql2Adapter } from "../../src/drivers/mysql2.js";
import { TABLE_NAMES } from "../shared.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return await getAll(pool.query(`SELECT * FROM ${ESCAPED_TABLE_NAME}`));
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await pool.execute(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await pool.execute(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: createTableQueryHandler(TABLE_NAMES.session),
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = mysql2Adapter(pool, TABLE_NAMES)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
