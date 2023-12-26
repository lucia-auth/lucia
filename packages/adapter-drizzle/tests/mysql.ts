import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { DrizzleMySQLAdapter } from "../src/drivers/mysql.js";
import mysql from "mysql2/promise";

import dotenv from "dotenv";
import { resolve } from "path";

import { mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";

dotenv.config({
	path: resolve(".env")
});

const connection = await mysql.createConnection({
	host: "localhost",
	user: "root",
	database: process.env.MYSQL_DATABASE,
	password: process.env.MYSQL_PASSWORD
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

const userTable = mysqlTable("test_user", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	username: varchar("username", {
		length: 255
	})
		.notNull()
		.unique()
});

const sessionTable = mysqlTable("user_session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 255
	})
		.notNull()
		.references(() => userTable.id),
	expiresAt: datetime("expires_at").notNull(),
	country: varchar("country", {
		length: 255
	})
});

const db = drizzle(connection);

const adapter = new DrizzleMySQLAdapter(db, sessionTable, userTable);

await testAdapter(adapter);

await connection.execute("DROP TABLE IF EXISTS user_session");
await connection.execute("DROP TABLE IF EXISTS test_user");

process.exit();
