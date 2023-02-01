import { default as adapterKysely } from "../../src/index.js";
import * as mysql from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";
import { createQueryHandler, KyselyDatabase } from "../db.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const dbKysely = new Kysely<KyselyDatabase>({
	dialect: new MysqlDialect({
		pool: mysql.createPool({
			host: "localhost",
			user: "root",
			database: process.env.MYSQL_DATABASE,
			password: process.env.MYSQL_PASSWORD
		})
	})
});

export const adapter = adapterKysely(dbKysely, "mysql2")(LuciaError);

export const queryHandler = createQueryHandler(dbKysely, "mysql2");
