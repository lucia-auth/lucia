/// <reference types="bun-types" />
import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { BunSQLiteAdapter } from "../src/drivers/bun-sqlite.js";
import { Database } from "bun:sqlite";

const db = new Database(":memory:");

db.exec(
	`CREATE TABLE user (
	id TEXT NOT NULL PRIMARY KEY,
	username TEXT NOT NULL UNIQUE
)`
);
db.exec(`CREATE TABLE user_session (
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

const adapter = new BunSQLiteAdapter(db, {
	user: "user",
	session: "user_session"
});

await testAdapter(adapter);
