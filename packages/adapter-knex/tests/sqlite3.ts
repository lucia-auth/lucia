import knex from "knex";
import dotenv from "dotenv";
import { resolve } from "path";
import { KnexSQLite3Adapter } from "../src/index.js";
import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";

dotenv.config({
	path: resolve(".env")
});

const db = knex({
  client: "sqlite3",
  connection: {
    filename: ":memory:"
  }
});

await db.schema.createTable("user", (table) => {
  table
    .string("userId")
    .primary();
  
  table
    .string("username")
    .notNullable()
    .unique();
});

await db.schema.createTable("session", (table) => {
  table
    .string("country");

  table
    .string("sessionId")
    .primary();
  
  table
    .timestamp("expiresAtTimestamp")
    .notNullable();
  
  table
    .string("userId")
    .notNullable();

  table
    .foreign("userId")
    .references("user.userId");
});

await db("user")
  .insert({
    userId: databaseUser.id,
    // @ts-ignore
    username: databaseUser.attributes.username
  });

const adapter = new KnexSQLite3Adapter(db, {
  users: "user",
  sessions: "session"
});

await testAdapter(adapter);
process.exit();
