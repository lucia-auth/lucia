import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { Mysql2Adapter } from "../src/drivers/mysql2.js";
import mysql from "mysql2/promise";

import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({
	path: resolve(".env")
});

const connection = await mysql.createConnection({
	host: "localhost",
	user: "root",
	database: process.env.MYSQL2_DATABASE,
	password: process.env.MYSQL2_PASSWORD
});

await connection.execute("DROP TABLE IF EXISTS user_session");
await connection.execute("DROP TABLE IF EXISTS test_user");

await connection.execute(`CREATE TABLE IF NOT EXISTS test_user (
	id VARCHAR(255) PRIMARY KEY,
	username VARCHAR(255) NOT NULL UNIQUE
)`);

await connection.execute(`CREATE TABLE IF NOT EXISTS user_session (
	id VARCHAR(255) PRIMARY KEY,
	user_id VARCHAR(255) NOT NULL,
	expires_at DATETIME NOT NULL,
	country VARCHAR(255),
	FOREIGN KEY (user_id) REFERENCES test_user(id)
)`);

await connection.execute("INSERT INTO test_user (id, username) VALUES (?, ?)", [
	databaseUser.id,
	databaseUser.attributes.username
]);

const adapter = new Mysql2Adapter(connection, {
	user: "test_user",
	session: "user_session"
});

await testAdapter(adapter);

await connection.execute("DROP TABLE IF EXISTS user_session");
await connection.execute("DROP TABLE IF EXISTS test_user");

process.exit();
