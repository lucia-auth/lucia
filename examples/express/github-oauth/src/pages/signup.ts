import { auth } from "../lucia.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SqliteError } from "better-sqlite3";

import type { Handler } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const renderSignup = (params: { error?: string; username?: string }) => {
	const error = params.error ?? "";
	const username = params.username ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "signup.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%error%%", error)
		.replaceAll("%%username%%", username);
	return html;
};

export const signupAction: Handler = async (req, res) => {
	const { username, password } = req.body;
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 4 ||
		username.length > 31
	) {
		const html = renderSignup({
			error: "Invalid username",
			username: typeof username === "string" ? username : ""
		});
		return res
			.status(400)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		const html = renderSignup({
			error: "Invalid password",
			username
		});
		return res
			.status(400)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
	try {
		const user = await auth.createUser({
			key: {
				providerId: "username", // auth method
				providerUserId: username, // unique id when using "username" auth method
				password // hashed by Lucia
			},
			attributes: {
				username
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	} catch (e) {
		// check for unique constraint error in user table
		if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
			const html = renderSignup({
				error: "Username already taken",
				username
			});
			return res
				.status(400)
				.setHeader("Content-Type", "text/html; charset=utf-8")
				.send(html);
		}

		const html = renderSignup({
			error: "An unknown error occurred"
		});
		return res
			.status(500)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
};
