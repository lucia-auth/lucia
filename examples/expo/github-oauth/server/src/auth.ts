import dotenv from "dotenv";

dotenv.config();

import { lucia } from "lucia";
import { hono } from "lucia/middleware";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";

import { github } from "@lucia-auth/oauth/providers";

import sqlite from "better-sqlite3";
import fs from "fs";

const db = sqlite(":memory:");
db.exec(fs.readFileSync("src/schema.sql", "utf8"));

export const auth = lucia({
	env: process.env.NODE_ENV === "production" ? "PROD" : "DEV",
	adapter: betterSqlite3(db, {
		user: "user",
		session: "user_session",
		key: "user_key"
	}),
	middleware: hono(),
	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});
