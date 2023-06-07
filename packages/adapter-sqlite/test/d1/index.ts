import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { D1Database, D1DatabaseAPI } from "@miniflare/d1";

import { d1Adapter } from "../../src/drivers/d1.js";
import { escapeName, helper } from "../../src/utils.js";
import { TABLE_NAMES, db } from "../db.js";

import type { D1Database as WorkerD1Database } from "@cloudflare/workers-types";
import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const D1 = new D1Database(new D1DatabaseAPI(db)) as any as WorkerD1Database;

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			const { results } = await D1.prepare(
				`SELECT * FROM ${ESCAPED_TABLE_NAME}`
			).all();
			return results ?? [];
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await D1.prepare(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`
			)
				.bind(...args)
				.run();
		},
		clear: async () => {
			await D1.exec(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: createTableQueryHandler(TABLE_NAMES.session),
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = d1Adapter(D1, TABLE_NAMES)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
