import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { sql } from "./db.js";
import {
	escapeName,
	helper,
	DatabaseSession,
	transformDatabaseSession
} from "../../src/utils.js";
import { postgresAdapter, getAll } from "../../src/drivers/postgres.js";
import { ESCAPED_SESSION_TABLE_NAME, TABLE_NAMES } from "../shared.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return await getAll(sql.unsafe(`SELECT * FROM ${ESCAPED_TABLE_NAME}`));
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await sql.unsafe(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await sql.unsafe(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: {
		...createTableQueryHandler(TABLE_NAMES.session),
		get: async () => {
			const result = await getAll<DatabaseSession>(
				sql.unsafe(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME}`)
			);
			return result.map((val) => transformDatabaseSession(val));
		}
	},
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = postgresAdapter(sql, TABLE_NAMES)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
