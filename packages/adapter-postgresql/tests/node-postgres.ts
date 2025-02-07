import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { NodePostgresAdapter } from "../src/drivers/node-postgres.js";
import dotenv from "dotenv";
import { resolve } from "path";
import pg from "pg";

dotenv.config({
	path: resolve(".env")
});

const pool = new pg.Pool({
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

const adapter = new NodePostgresAdapter(pool, {
	user: "public.user",
	session: "public.session"
});

await testAdapter(adapter);

await pool.query("DROP TABLE public.session");
await pool.query("DROP TABLE public.user");

process.exit();
