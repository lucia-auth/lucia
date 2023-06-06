import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { pool } from "./db.js";
import { helper } from "../../src/utils.js";
import { getAll, mysql2Adapter } from "../../src/drivers/mysql2.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	return {
		get: async () => {
			return await getAll(pool.query(`SELECT * FROM ${tableName}`));
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await pool.execute(
				`INSERT INTO ${tableName} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await pool.execute(`DELETE FROM ${tableName}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler("auth_user"),
	session: createTableQueryHandler("auth_session"),
	key: createTableQueryHandler("auth_key")
};

const adapter = mysql2Adapter(pool)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));
process.exit(0);
