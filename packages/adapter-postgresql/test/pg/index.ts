import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { pool } from "./db.js";
import { escapeName, helper } from "../../src/utils.js";
import { getAll, pgAdapter, transformPgSession } from "../../src/drivers/pg.js";
import { ESCAPED_SESSION_TABLE_NAME, TABLE_NAMES } from "../shared.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import type { PgSession } from "../../src/drivers/pg.js";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return await getAll(pool.query(`SELECT * FROM ${ESCAPED_TABLE_NAME}`));
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await pool.query(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await pool.query(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: {
		...createTableQueryHandler(TABLE_NAMES.session),
		get: async () => {
			const result = await getAll(
				pool.query<PgSession>(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME}`)
			);
			return result.map((val) => transformPgSession(val));
		}
	},
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = pgAdapter(pool, TABLE_NAMES)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
