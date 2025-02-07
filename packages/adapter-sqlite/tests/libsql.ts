import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { LibSQLAdapter } from "../src/drivers/libsql.js";
import { createClient } from "@libsql/client";
import fs from "fs/promises";

await fs.rm("test/libsql/test.db");

const client = createClient({
	url: "file:test/libsql/test.db"
});

await client.execute(
	`CREATE TABLE user (
	id TEXT NOT NULL PRIMARY KEY,
	username TEXT NOT NULL UNIQUE
)`
);
await client.execute(`CREATE TABLE user_session (
	id TEXT NOT NULL PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	country TEXT,
	FOREIGN KEY (user_id) REFERENCES user(id)
)`);

await client.execute({
	sql: `INSERT INTO user (id, username) VALUES (?, ?)`,
	args: [databaseUser.id, databaseUser.attributes.username]
});

const adapter = new LibSQLAdapter(client, {
	user: "user",
	session: "user_session"
});

try {
	await testAdapter(adapter);
} finally {
	await fs.rm("test/libsql/test.db");
}
