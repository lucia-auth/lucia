import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { PostgresAdapter } from "../src/drivers/postgres.js";
import dotenv from "dotenv";
import { resolve } from "path";
import postgres from "postgres";

dotenv.config({
	path: resolve(".env")
});

export const sql = postgres(process.env.POSTGRES_DATABASE_URL ?? "");

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

const adapter = new PostgresAdapter(sql, {
	user: "public.user",
	session: "public.session"
});

await testAdapter(adapter);

await sql`DROP TABLE public.session`;
await sql`DROP TABLE public.user`;

process.exit();

declare module "lucia" {
	interface Register {
		DatabaseUserAttributes: {
			username: string;
		};
		DatabaseSessionAttributes: {
			country: string;
		};
	}
}
