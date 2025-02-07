import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { BetterSqlite3Adapter } from "../src/drivers/better-sqlite3.js";
import sqlite from "better-sqlite3";

const db = sqlite(":memory:");

db.exec(
	`CREATE TABLE user (
	id TEXT NOT NULL PRIMARY KEY,
	username TEXT NOT NULL UNIQUE
)`
).exec(`CREATE TABLE user_session (
	id TEXT NOT NULL PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	country TEXT,
	FOREIGN KEY (user_id) REFERENCES user(id)
)`);

db.prepare(`INSERT INTO user (id, username) VALUES (?, ?)`).run(
	databaseUser.id,
	databaseUser.attributes.username
);

const adapter = new BetterSqlite3Adapter(db, {
	user: "user",
	session: "user_session"
});

await testAdapter(adapter);
