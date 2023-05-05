import sqlite from "better-sqlite3";
import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";

import { betterSqlite3 as betterSqlite3Adapter } from "../../src/index.js";
import { betterSqliteRunner } from "../../src/better-sqlite3/runner.js";
import { createQueryHandler } from "../index.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const db = sqlite("test/main.db");

export const adapter = betterSqlite3Adapter(db)(LuciaError);
export const queryHandler = createQueryHandler(betterSqliteRunner(db));
