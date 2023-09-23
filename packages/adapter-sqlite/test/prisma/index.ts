import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { PrismaClient } from "@prisma/client";
import sqlite from "better-sqlite3";

import { TABLE_NAMES } from "../db.js";
import { prismaAdapter } from "../../src/drivers/prisma.js";
import { escapeName, helper } from "../../src/utils.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const db = sqlite("test/prisma/prisma.db");

const createTableQueryHandler = (tableName: string): TableQueryHandler => {
	const ESCAPED_TABLE_NAME = escapeName(tableName);
	return {
		get: async () => {
			return db.prepare(`SELECT * FROM ${ESCAPED_TABLE_NAME}`).all();
		},
		insert: async (value: any) => {
			const [fields, placeholders, args] = helper(value);
			db.prepare(
				`INSERT INTO ${ESCAPED_TABLE_NAME} ( ${fields} ) VALUES ( ${placeholders} )`
			).run(...args);
		},
		clear: async () => {
			db.exec(`DELETE FROM ${ESCAPED_TABLE_NAME}`);
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(TABLE_NAMES.user),
	session: createTableQueryHandler(TABLE_NAMES.session),
	key: createTableQueryHandler(TABLE_NAMES.key)
};

const client = new PrismaClient();

const adapter = prismaAdapter(client, TABLE_NAMES)(LuciaError);

testAdapter(adapter, new Database(queryHandler));
