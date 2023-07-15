import { lucia } from "lucia";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { astro } from "lucia/middleware";
import sqlite from "better-sqlite3";

const db = sqlite("main.db");

export const auth = lucia({
	adapter: betterSqlite3(db, {
		user: "user",
		session: "user_session",
		key: "user_key"
	}),
	middleware: astro(),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	getUserAttributes: (data) => {
		return {
			email: data.email,
			emailVerified: Boolean(data.email_verified)
		};
	}
});

export type Auth = typeof auth;
