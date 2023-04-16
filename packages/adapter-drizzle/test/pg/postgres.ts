import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { adapterWrapper, getQueryHandler } from "./utils";
import { testAdapter } from "@lucia-auth/adapter-test";

export async function testPostgresPackage() {
	console.log("testing 'postgres' package\n\n");

	const client = postgres("postgres://postgres:password@localhost:5432");
	const db = drizzle(client);

	await migrate(db, {
		migrationsFolder: "./test/migrations/pg"
	});

	// add the username column because it's not in migrations
	client`ALTER TABLE "auth_user" ADD COLUMN IF NOT EXISTS "username" text NOT NULL;`;

	const queryHandler = getQueryHandler(db);
	// TODO: remove 'as any' if you gets the 'postgres' package driver working
	const adapter = adapterWrapper(db as any);

	testAdapter(adapter, queryHandler, true);

	// await client.end();
}
