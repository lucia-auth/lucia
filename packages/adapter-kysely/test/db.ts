import { Database } from "@lucia-auth/adapter-test";
import adapterKysely from "../src/index.js";
import pg from "pg";
const { Pool } = pg;
import { Kysely, PostgresDialect } from "kysely";
import { DB, User } from "../src/dbTypes.js";
import { convertSession } from "../src/utils.js";

import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";

dotenv.config({
	path: `${resolve()}/.env`
});

interface UserExt extends User {
	username: string;
}

interface DBExt extends Omit<DB, "user"> {
	user: UserExt;
}

const dbKysely = new Kysely<DBExt>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.DATABASE_URL
		})
	})
});

export const adapter = adapterKysely(dbKysely)(LuciaError);

export const db: Database = {
	getUsers: async () => {
		const data = await dbKysely.selectFrom("user").selectAll().execute();
		if (!data) throw new Error("Failed to fetch from databaes");
		return data;
	},
	getSessions: async () => {
		const data = await dbKysely.selectFrom("session").selectAll().execute();
		if (!data) throw new Error("Failed to fetch from databaes");
		return data.map((session) => convertSession(session));
	},
	insertUser: async (user) => {
		await dbKysely.insertInto("user").values(user).execute();
	},
	insertSession: async (session) => {
		await dbKysely.insertInto("session").values(session).execute();
	},
	clearUsers: async () => {
		await dbKysely.deleteFrom("user").where("username", "like", "user%").execute();
	},
	clearSessions: async () => {
		await dbKysely.deleteFrom("session").where("id", ">=", "0").execute();
	}
};
