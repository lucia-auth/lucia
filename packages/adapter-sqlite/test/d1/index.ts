import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { D1Adapter } from "../../src/drivers/d1.js";
import { TABLE_NAMES } from "../db.js";
import { D1Database, D1DatabaseAPI } from "@miniflare/d1";
import sqlite from "better-sqlite3";

const db = sqlite(":memory:");
const d1 = new D1Database(new D1DatabaseAPI(db));

await d1.exec(
	`CREATE TABLE ${TABLE_NAMES.user} ( id TEXT NOT NULL PRIMARY KEY, username TEXT NOT NULL UNIQUE )`
);
await d1.exec(
	`CREATE TABLE ${TABLE_NAMES.session} ( id TEXT NOT NULL PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL, country TEXT, FOREIGN KEY (user_id) REFERENCES user(id))`
);

await d1
	.prepare(`INSERT INTO ${TABLE_NAMES.user} (id, username) VALUES (?, ?)`)
	.bind(databaseUser.userId, databaseUser.attributes.username)
	.run();

const adapter = new D1Adapter(d1, TABLE_NAMES);

await testAdapter(adapter);
