import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { adapterWrapper, getQueryHandler, migrate } from "./utils";
import { testAdapter } from "@lucia-auth/adapter-test";
import { rm } from "node:fs/promises";

export async function testLibSql() {
	console.log("\n\ntesting libsql client\n\n");

	const libsql = createClient({
		url: "file:test.db"
	});
	const libsqlclient = drizzle(libsql);

	await migrate((sql) => libsql.execute(sql));

	testAdapter(
		adapterWrapper(libsqlclient),
		getQueryHandler(libsqlclient),
		false
	);

	await rm("test.db");
}
