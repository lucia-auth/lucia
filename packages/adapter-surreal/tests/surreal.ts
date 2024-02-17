import { databaseUser } from "@lucia-auth/adapter-test";
import { testAdapter } from "@lucia-auth/adapter-test";
import dotenv from "dotenv";
import { resolve } from "path";
import { Surreal } from "surrealdb.js";
import { SurrealAdapter } from "../src/index.js";

dotenv.config({ path: `${resolve()}/.env` });

const db = new Surreal();
await db.connect(process.env.SURREALDB_URL);
db.signin({
	username: process.env.SURREALDB_USR,
	password: process.env.SURREALDB_PWD,
	namespace: "test",
	database: "test"
});

const adapter = new SurrealAdapter({
	db,
	user_tb: "user",
	session_tb: "session"
});

await db.query('create type::thing("user", $id) set username = $usr', {
	id: databaseUser.id,
	usr: databaseUser.attributes.username
});

await testAdapter(adapter);

await db.query("remove table user");
await db.query("remove table session");

process.exit(0);

declare module "lucia" {
	interface Register {
		DatabaseUserAttributes: {
			username: string;
		};
	}
}
