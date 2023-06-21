import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { connection } from "./db.js";
import { helper, escapeName } from "../../src/utils.js";
import {
	getAll,
	planetscaleAdapter,
	transformPlanetscaleSession
} from "../../src/drivers/planetscale.js";
import { TABLE_NAMES, ESCAPED_SESSION_TABLE_NAME } from "../shared.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import type { PlanetscaleSession } from "../../src/drivers/planetscale.js";

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return await getAll(
				connection.execute(`SELECT * FROM ${ESCAPED_TABLE_NAME}`)
			);
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await connection.execute(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`,
				args
			);
		},
		clear: async () => {
			await connection.execute(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: {
		...createTableQueryHandler(TABLE_NAMES.session),
		get: async () => {
			const result = await getAll<PlanetscaleSession>(
				connection.execute(`SELECT * FROM ${ESCAPED_SESSION_TABLE_NAME}`)
			);
			return result.map((val) => transformPlanetscaleSession(val));
		}
	},
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const adapter = planetscaleAdapter(connection, TABLE_NAMES)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
