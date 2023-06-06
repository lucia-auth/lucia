import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { pool } from "./db.js";
import { helper } from "../../src/utils.js";
import { getAll, pgAdapter, transformPgSession } from "../../src/drivers/pg.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import type { PgSession } from "../../src/drivers/pg.js";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	return {
		get: async () => {
			return await getAll(pool.query(`SELECT * FROM ${tableName}`));
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await pool.query(
				`INSERT INTO ${tableName} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await pool.query(`DELETE FROM ${tableName}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler("auth_user"),
	session: {
		...createTableQueryHandler("auth_session"),
		get: async () => {
			const result = await getAll<PgSession>(
				pool.query(`SELECT * FROM auth_session`)
			);
			return result.map((val) => transformPgSession(val));
		}
	},
	key: createTableQueryHandler("auth_key")
};

const adapter = pgAdapter(pool)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
