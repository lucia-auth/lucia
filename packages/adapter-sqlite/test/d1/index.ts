import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { D1Database, D1DatabaseAPI } from "@miniflare/d1";

import { d1 as d1Adapter } from "../../src/index.js";
import { helper } from "../../src/utils.js";

import type { D1Database as WorkerD1Database } from "@cloudflare/workers-types";
import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import { db } from "../db.js";

const D1 = new D1Database(new D1DatabaseAPI(db)) as any as WorkerD1Database;

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	return {
		get: async () => {
			const { results } = await D1.prepare(`SELECT * FROM ${tableName}`).all();
			return results ?? [];
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await D1.prepare(
				`INSERT INTO ${tableName} ( ${fields} ) VALUES ( ${placeholders} )`
			)
				.bind(...args)
				.run();
		},
		clear: async () => {
			await D1.exec(`DELETE FROM ${tableName}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler("auth_user"),
	session: createTableQueryHandler("auth_session"),
	key: createTableQueryHandler("auth_key")
};

const adapter = d1Adapter(D1)(LuciaError);
await testAdapter(adapter, new Database(queryHandler));
