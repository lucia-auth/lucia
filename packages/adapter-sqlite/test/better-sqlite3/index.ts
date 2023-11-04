import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { BetterSQLite3Adapter } from "../../src/drivers/better-sqlite3.js";
import { TABLE_NAMES } from "../db.js";
import sqlite from "better-sqlite3";

const db = sqlite(":memory:");

db.exec(
	`CREATE TABLE ${TABLE_NAMES.user} (
	id TEXT NOT NULL PRIMARY KEY,
	username TEXT NOT NULL UNIQUE
)`
).exec(`CREATE TABLE ${TABLE_NAMES.session} (
	id TEXT NOT NULL PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires INTEGER NOT NULL,
	country TEXT,
	FOREIGN KEY (user_id) REFERENCES user(id)
)`);

db.prepare(`INSERT INTO ${TABLE_NAMES.user} (id, username) VALUES (?, ?)`).run(
	databaseUser.userId,
	databaseUser.attributes.username
);

const adapter = new BetterSQLite3Adapter(db, TABLE_NAMES);

await testAdapter(adapter);
