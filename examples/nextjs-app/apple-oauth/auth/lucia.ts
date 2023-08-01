import { lucia } from "lucia";
import { nextjs } from "lucia/middleware";
import { apple } from "@lucia-auth/oauth/providers";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import sqlite from "better-sqlite3";
import path from "path";
import { readFileSync } from "fs";
// import "lucia/polyfill/node";

const db = sqlite("main.db");

export const auth = lucia({
	adapter: betterSqlite3(db, {
		user: "user",
		session: "user_session",
		key: "user_key"
	}),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs(),
	sessionCookie: {
		expires: false
	},
	getUserAttributes: (data) => {
		return {
			email: data.email
		};
	},
	experimental: {
		debugMode: true
	}
});

const certificatePath = path.join(
	process.cwd(),
	process.env.APPLE_CERT_PATH ?? ""
);

const certificate = readFileSync(certificatePath, "utf-8");

export const appleAuth = apple(auth, {
	clientId: process.env.APPLE_CLIENT_ID,
	certificate,
	keyId: process.env.APPLE_KEY_ID,
	redirectUri: process.env.APPLE_REDIRECT_URI,
	teamId: process.env.APPLE_TEAM_ID
});

export type Auth = typeof auth;
