import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { D1Adapter } from "../src/drivers/d1.js";
import { D1Database, D1DatabaseAPI } from "@miniflare/d1";
import sqlite from "better-sqlite3";

const db = sqlite(":memory:");
const d1 = new D1Database(new D1DatabaseAPI(db));

await d1.exec(`CREATE TABLE user ( id TEXT NOT NULL PRIMARY KEY, username TEXT NOT NULL UNIQUE )`);
await d1.exec(
	`CREATE TABLE user_session ( id TEXT NOT NULL PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, country TEXT, FOREIGN KEY (user_id) REFERENCES user(id))`
);

await d1
	.prepare(`INSERT INTO user (id, username) VALUES (?, ?)`)
	.bind(databaseUser.id, databaseUser.attributes.username)
	.run();

const adapter = new D1Adapter(d1, {
	user: "user",
	session: "user_session"
});

await testAdapter(adapter);
