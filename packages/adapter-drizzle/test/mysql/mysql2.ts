import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { testAdapter } from "@lucia-auth/adapter-test";
import { adapterWrapper, getQueryHandler } from "./utils";

export async function testMySql2() {
	const client = createPool({
		host: "127.0.0.1",
		user: "root",
		password: "password",
		database: "lucia"
	});

	const db = drizzle(client);


    
	console.log("\n\ntesting mysql2 client\n\n");

	await testAdapter(adapterWrapper(db), getQueryHandler(db));
}
