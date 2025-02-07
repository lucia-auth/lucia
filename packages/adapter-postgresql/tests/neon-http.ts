import { testAdapter, databaseUser } from "@lifeworld/adapter-test";
import { NeonHTTPAdapter } from "../src/drivers/neon-http.js";
import dotenv from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

dotenv.config({
	path: resolve(".env")
});

const sql = neon(process.env.NEON_CONNECTION_URL!);

await sql("DROP TABLE IF EXISTS public.session");
await sql("DROP TABLE IF EXISTS public.user");

await sql(`
CREATE TABLE public.user (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
)`);

await sql(`
CREATE TABLE public.session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user(id),
	expires_at TIMESTAMPTZ NOT NULL,
    country TEXT NOT NULL
)`);

await sql(`INSERT INTO public.user (id, username) VALUES ($1, $2)`, [
	databaseUser.id,
	databaseUser.attributes.username
]);

const adapter = new NeonHTTPAdapter(sql, {
	user: "public.user",
	session: "public.session"
});

await testAdapter(adapter);

await sql("DROP TABLE public.session");
await sql("DROP TABLE public.user");

process.exit();
