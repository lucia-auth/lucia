import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { DrizzlePostgreSQLAdapter } from "../src/drivers/postgresql.js";
import dotenv from "dotenv";
import { resolve } from "path";
import pg from "pg";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";

dotenv.config({
	path: resolve(".env")
});

export const pool = new pg.Pool({
	connectionString: process.env.POSTGRES_DATABASE_URL
});

await pool.query("DROP TABLE IF EXISTS public.session");
await pool.query("DROP TABLE IF EXISTS public.user");

await pool.query(`
CREATE TABLE public.user (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
)`);

await pool.query(`
CREATE TABLE public.session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user(id),
	expires_at TIMESTAMPTZ NOT NULL,
    country TEXT NOT NULL
)`);

await pool.query(`INSERT INTO public.user (id, username) VALUES ($1, $2)`, [
	databaseUser.id,
	databaseUser.attributes.username
]);

const userTable = pgTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique()
});

const sessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true
	}).notNull(),
	country: text("country")
});

const db = drizzle(pool);

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);

await testAdapter(adapter);

await pool.query("DROP TABLE public.session");
await pool.query("DROP TABLE public.user");

process.exit();
