import { lucia } from "lucia";
import { express } from "lucia/middleware";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
// import "lucia/polyfill/node";

import { sqliteDatabase } from "./db.js";

export const auth = lucia({
	adapter: betterSqlite3(sqliteDatabase, {
		user: "user",
		session: "user_session",
		key: "user_key"
	}),
	middleware: express(),
	env: process.env.NODE_ENV === "production" ? "PROD" : "DEV",
	getUserAttributes: (data) => {
		return {
			email: data.email,
			emailVerified: Boolean(data.email_verified)
		};
	}
});

export type Auth = typeof auth;
