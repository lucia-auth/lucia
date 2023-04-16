import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { adapterWrapper, getQueryHandler, migrate } from "./utils";
import { testAdapter } from "@lucia-auth/adapter-test";
import { rm } from "node:fs/promises";

export async function testBsqlite3() {
    console.log("\n\ntesting better-sqlite3 client\n\n")

	const bsqlite3 = new Database("test.db");
	const bsqlite3client = drizzle(bsqlite3);
	await migrate((sql) => bsqlite3.exec(sql));
	testAdapter(adapterWrapper(bsqlite3client), getQueryHandler(bsqlite3client));

    await rm("test.db");
}
