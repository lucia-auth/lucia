import { databaseUser, testAdapter } from "@lucia-auth/adapter-test";
import dotenv from "dotenv";
import { resolve } from "path";
import { Surreal } from 'surrealdb.js';
import {SurrqlAdapter} from "../src/index"

dotenv.config({ path: `${resolve()}/.env` });

const {
  SURREALDB_URL: url = "http://127.0.0.1:8000/rpc",
  SURREALDB_USER: user = "root",
  SURREALDB_PASS: pass = "root",
  SURREALDB_NS: ns = "namespace_test",
  SURREALDB_DB: dbName = "db_test",
} = process.env;

const db = new Surreal();

async function main() {

  try {
    // Connect to the database
    await db.connect(url, {
      // Set the namespace and database for the connection
      namespace: ns,
      database: dbName,

      // Set the authentication details for the connection
      auth: {
          username: user,
          password: pass,
      },
    });

    await db.query(`CREATE test_user:${databaseUser.id} SET username = "${databaseUser.attributes.username}";`)
    
    const adapter = new SurrqlAdapter(db, {
      user: "test_user",
      session: "test_session"
    });
    
    
    await testAdapter(adapter);

    await db.query(`REMOVE TABLE test_user;`)

    await db.query(`REMOVE TABLE test_session;`)

    process.exit();

  } catch (error) {
    console.log(error)
  }
}

main()

declare module "lucia" {
	interface Register {
		DatabaseUserAttributes: {
			username: string;
		};
	}
}
