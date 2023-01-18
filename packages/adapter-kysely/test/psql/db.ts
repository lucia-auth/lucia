import { Database } from "@lucia-auth/adapter-test";
import {
	default as adapterKysely,
	type KyselyLuciaDatabase,
	type KyselyUser
} from "../../src/index.js";
import pg from "pg";
const { Pool } = pg;
import { Kysely, PostgresDialect } from "kysely";
import { convertSession } from "../../src/utils.js";

import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";

dotenv.config({
	path: `${resolve()}/.env`
});

interface User extends KyselyUser {
	username: string;
}

interface KyselyDatabase extends Omit<KyselyLuciaDatabase, "user"> {
	user: User;
}

const dbKysely = new Kysely<KyselyDatabase>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.PSQL_DATABASE_URL
		})
	})
});

export const adapter = adapterKysely(dbKysely, "pg")(LuciaError);

export const db: Database = {
	getUsers: async () => {
		const data = await dbKysely.selectFrom("user").selectAll().execute();
		if (!data) throw new Error("Failed to fetch from database");
		return data;
	},
	getSessions: async () => {
		const data = await dbKysely.selectFrom("session").selectAll().execute();
		if (!data) throw new Error("Failed to fetch from database");
		return data.map((session) => convertSession(session));
	},
	insertUser: async (user) => {
		await dbKysely.insertInto("user").values(user).execute();
	},
	insertSession: async (session) => {
		await dbKysely.insertInto("session").values(session).execute();
	},
	clearUsers: async () => {
		await dbKysely
			.deleteFrom("user")
			.where("username", "like", "user%")
			.execute();
	},
	clearSessions: async () => {
		await dbKysely.deleteFrom("session").where("id", ">=", "0").execute();
	}
};
