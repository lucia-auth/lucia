import { default as adapterKysely } from "../../src/index.js";
import pg from "pg";
const { Pool } = pg;
import { Kysely, PostgresDialect } from "kysely";

import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";
import { KyselyDatabase, createQueryHandler } from "../db.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const dbKysely = new Kysely<KyselyDatabase>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.PSQL_DATABASE_URL
		})
	})
});

export const adapter = adapterKysely(dbKysely, "pg")(LuciaError);

export const queryHandler = createQueryHandler(dbKysely, "pg");
