import { Database } from "@lucia-auth/adapter-test";
import {
	default as adapterKysely,
	type KyselyLuciaDatabase,
	type KyselyUser
} from "../../src/index.js";
import * as mysql from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
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
	dialect: new MysqlDialect({
		pool: mysql.createPool({
			host: "localhost",
			user: "root",
			database: process.env.MYSQL_DATABASE,
			password: process.env.MYSQL_PASSWORD
		})
	})
});

export const adapter = adapterKysely(dbKysely, "mysql2")(LuciaError);

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
