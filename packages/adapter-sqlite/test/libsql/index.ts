import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { LibSQLAdapter } from "../../src/drivers/libsql.js";
import { TABLE_NAMES } from "../db.js";
import { createClient } from "@libsql/client";
import fs from "fs/promises";

await fs.rm("test/libsql/test.db");

const client = createClient({
	url: "file:test/libsql/test.db"
});

await client.execute(
	`CREATE TABLE ${TABLE_NAMES.user} (
	id TEXT NOT NULL PRIMARY KEY,
	username TEXT NOT NULL UNIQUE
)`
);
await client.execute(`CREATE TABLE ${TABLE_NAMES.session} (
	id TEXT NOT NULL PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	country TEXT,
	FOREIGN KEY (user_id) REFERENCES user(id)
)`);

await client.execute({
	sql: `INSERT INTO ${TABLE_NAMES.user} (id, username) VALUES (?, ?)`,
	args: [databaseUser.userId, databaseUser.attributes.username]
});

const adapter = new LibSQLAdapter(client, TABLE_NAMES);

try {
	await testAdapter(adapter);
} finally {
	await fs.rm("test/libsql/test.db");
}
