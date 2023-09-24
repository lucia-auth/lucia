import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { PrismaClient } from "@prisma/client";

import { TABLE_NAMES } from "../shared.js";
import { prismaAdapter } from "../../src/drivers/prisma.js";
import { escapeName, helper } from "../../src/utils.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const client = new PrismaClient();

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return await client.$queryRawUnsafe(`SELECT * FROM ${ESCAPED_TABLE_NAME}`)
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			await client.$executeRawUnsafe(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`
			, ...args)
		},
		clear: async () => {
			await client.$executeRawUnsafe(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: createTableQueryHandler(TABLE_NAMES.session),
	key: createTableQueryHandler(TABLE_NAMES.key)
};


const adapter = prismaAdapter(client, TABLE_NAMES)(LuciaError);

testAdapter(adapter, new Database(queryHandler));
