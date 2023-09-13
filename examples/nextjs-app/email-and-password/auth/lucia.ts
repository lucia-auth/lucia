import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { cache } from "react";
import * as context from "next/headers";
// import "lucia/polyfill/node";

import { sqliteDatabase } from "./db";

export const auth = lucia({
	adapter: betterSqlite3(sqliteDatabase, {
		user: "user",
		session: "user_session",
		key: "user_key"
	}),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs_future(),
	sessionCookie: {
		expires: false
	},
	getUserAttributes: (data) => {
		return {
			email: data.email,
			emailVerified: Boolean(data.email_verified)
		};
	}
});

export type Auth = typeof auth;

export const getPageSession = cache(() => {
	const authRequest = auth.handleRequest("GET", context);
	return authRequest.validate();
});
