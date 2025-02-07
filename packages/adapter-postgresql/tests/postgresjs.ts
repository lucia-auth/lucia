import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { PostgresJsAdapter } from "../src/drivers/postgresjs.js";
import dotenv from "dotenv";
import { resolve } from "path";
import postgres from "postgres";

dotenv.config({
	path: resolve(".env")
});

const sql = postgres(process.env.POSTGRES_DATABASE_URL ?? "");

await sql`DROP TABLE IF EXISTS public.session`;
await sql`DROP TABLE IF EXISTS public.user`;

await sql`CREATE TABLE public.user (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
)`;

await sql`CREATE TABLE public.session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user(id),
	expires_at TIMESTAMPTZ NOT NULL,
    country TEXT NOT NULL
)`;

await sql`INSERT INTO public.user (id, username) VALUES (${databaseUser.id}, ${databaseUser.attributes.username})`;

const adapter = new PostgresJsAdapter(sql, {
	user: "public.user",
	session: "public.session"
});

await testAdapter(adapter);

await sql`DROP TABLE public.session`;
await sql`DROP TABLE public.user`;

process.exit();
