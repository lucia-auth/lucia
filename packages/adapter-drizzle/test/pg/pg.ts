import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { adapterWrapper, getQueryHandler } from "./utils";
import { testAdapter } from "@lucia-auth/adapter-test";

export async function testPgPackage() {
	console.log("testing 'pg' package\n\n");
	const client = new pg.Pool({
		connectionString: "postgres://postgres:password@localhost:5432"
	});
	await client.connect();
	const db = drizzle(client);

	await migrate(db, {
		migrationsFolder: "./test/migrations/pg"
	});

	// add the username column because it's not in migrations
	await client.query(
		`ALTER TABLE "auth_user" ADD COLUMN IF NOT EXISTS "username" text NOT NULL;`
	);

	const queryHandler = getQueryHandler(db);
	const adapter = adapterWrapper(db);

	testAdapter(adapter, queryHandler);
}
