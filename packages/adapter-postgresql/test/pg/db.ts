import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";

import { pgAdapter } from "../../src/pg/index.js";
import { pgRunner } from "../../src/pg/runner.js";
import pg from "pg";
import { createQueryHandler } from "../index.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const pool = new pg.Pool({
	connectionString: process.env.PSQL_DATABASE_URL
});

export const adapter = pgAdapter(pool)(LuciaError);
export const queryHandler = createQueryHandler(pgRunner(pool));
