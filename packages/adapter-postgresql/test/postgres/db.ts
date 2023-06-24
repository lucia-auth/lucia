import dotenv from "dotenv";
import { resolve } from "path";
import postgres from "postgres";

dotenv.config({
	path: `${resolve()}/.env`
});

export const sql = postgres(process.env.PSQL_DATABASE_URL);
