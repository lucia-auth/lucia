import { lucia } from "lucia";
import { github } from "@lucia-auth/oauth/providers";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { h3 } from "lucia/middleware";
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
	middleware: h3(),
	env: process.dev ? "DEV" : "PROD",
	getUserAttributes: (data) => {
		return {
			githubUsername: data.github_username
		};
	}
});

const runtimeConfig = useRuntimeConfig();

export const githubAuth = github(auth, {
	clientId: runtimeConfig.githubClientId,
	clientSecret: runtimeConfig.githubClientSecret
});

export type Auth = typeof auth;
