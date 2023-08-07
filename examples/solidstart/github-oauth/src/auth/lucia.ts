import { lucia } from "lucia";
import { web } from "lucia/middleware";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { github } from "@lucia-auth/oauth/providers";
import sqlite from "better-sqlite3";
import "lucia/polyfill/node";

const db = sqlite("main.db");

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
			githubUsername: data.github_username
		};
	}
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});

export type Auth = typeof auth;
