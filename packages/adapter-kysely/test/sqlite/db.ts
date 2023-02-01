import { default as adapterKysely } from "../../src/index.js";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";
import { createQueryHandler, KyselyDatabase } from "../db.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const dbKysely = new Kysely<KyselyDatabase>({
	dialect: new SqliteDialect({
		database: new SQLite("sqlite/main.db")
	})
});

export const adapter = adapterKysely(dbKysely, "better-sqlite3")(LuciaError);

export const queryHandler = createQueryHandler(dbKysely, "better-sqlite3");
