import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { connection } from "./db.js";
import { helper } from "../../src/utils.js";
import { getAll, planetscaleAdapter, transformDatabaseSessionResult } from "../../src/drivers/planetscale.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import type { PlanetscaleSessionSchema } from "../../src/drivers/planetscale.js";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	return {
		get: async () => {
			if (tableName === "auth_session") {
				const result = await getAll<PlanetscaleSessionSchema>(connection.execute(`SELECT * FROM ${tableName}`));
				return result.map(val => transformDatabaseSessionResult(val))
			}
			return await getAll(connection.execute(`SELECT * FROM ${tableName}`));
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await connection.execute(
				`INSERT INTO ${tableName} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await connection.execute(`DELETE FROM ${tableName}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler("auth_user"),
	session: createTableQueryHandler("auth_session"),
	key: createTableQueryHandler("auth_key")
};

const adapter = planetscaleAdapter(connection)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));
process.exit(0);
