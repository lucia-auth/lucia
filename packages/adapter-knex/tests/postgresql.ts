import knex from "knex";
import dotenv from "dotenv";
import { resolve } from "path";
import { KnexPostgreSQLAdapter } from "../src/index.js";
import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";

dotenv.config({
	path: resolve(".env")
});

const db = knex({
  client: "pg",
  connection: {
    user: "root",
    host: "localhost",
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD
  }
});

await db.schema.dropTableIfExists("session");
await db.schema.dropTableIfExists("user");

await db.schema.createTable("user", (table) => {
  table
    .text("id")
    .primary();
  
  table
    .text("username")
    .notNullable()
    .unique();
});

await db.schema.createTable("session", (table) => {
  table
    .text("country");

  table
    .text("id")
    .primary();
  
  table
    .timestamp("expiresAtTimestamp")
    .notNullable();
  
  table
    .text("userId")
    .notNullable();

  table
    .foreign("userId")
    .references("user.id");
});

await db("user")
  .insert({
    id: databaseUser.id,
    // @ts-ignore
    username: databaseUser.attributes.username
  });

const adapter = new KnexPostgreSQLAdapter(db, {
  users: "user",
  sessions: "session"
});

await testAdapter(adapter);

await db.schema.dropTableIfExists("session");
await db.schema.dropTableIfExists("user");

process.exit();
