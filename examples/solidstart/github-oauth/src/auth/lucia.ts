import { lucia } from "lucia";
import { web } from "lucia/middleware";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { github } from "@lucia-auth/oauth/providers";
// import "lucia/polyfill/node";

import sqlite from "better-sqlite3";
import fs from "fs";

const db = sqlite(":memory:");
db.exec(fs.readFileSync("schema.sql", "utf8"));

export const auth = lucia({
	adapter: betterSqlite3(db, {
		user: "user",
		session: "user_session",
		key: "user_key"
	}),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: web(),
	sessionCookie: {
		expires: false
	},
	getUserAttributes: (data) => {
		return {
			githubUsername: data.username
		};
	}
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});

export type Auth = typeof auth;
