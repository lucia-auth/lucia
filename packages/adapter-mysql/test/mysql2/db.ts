import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";
import { mysql2 as mysql2Adapter } from "../../src/index.js";
import { mysql2Runner } from "../../src/mysql2/runner.js";
import { createQueryHandlerFromAsyncRunner } from "../index.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const pool = mysql.createPool({
	host: "localhost",
	user: "root",
	database: process.env.MYSQL_DATABASE,
	password: process.env.MYSQL_PASSWORD
});
export const adapter = mysql2Adapter(pool)(LuciaError);
export const queryHandler = createQueryHandlerFromAsyncRunner(
	mysql2Runner(pool)
);
