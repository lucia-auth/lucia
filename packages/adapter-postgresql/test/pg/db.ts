import dotenv from "dotenv";
import { resolve } from "path";
import pg from "pg";

dotenv.config({
	path: `${resolve()}/.env`
});

export const pool = new pg.Pool({
	connectionString: process.env.PSQL_DATABASE_URL
});
