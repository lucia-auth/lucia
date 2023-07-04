import { LuciaError } from "lucia";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { auth } from "../lucia.js";

import type { Handler } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const renderLogin = (params: { error?: string; username?: string }) => {
	const error = params.error ?? "";
	const username = params.username ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "login.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%error%%", error)
		.replaceAll("%%username%%", username);
	return html;
};

export const loginAction: Handler = async (req, res) => {
	const { username, password } = req.body;
	// basic check
	if (
		typeof username !== "string" ||
		password.length < 1 ||
		username.length > 31
	) {
		const html = renderLogin({
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
		password.length < 1 ||
		password.length > 255
	) {
		const html = renderLogin({
			error: "Invalid password",
			username
		});
		return res
			.status(400)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
	try {
		// find user by key
		// and validate password
		const user = await auth.useKey("username", username, password);
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
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			const html = renderLogin({
				error: "Incorrect username or password",
				username
			});
			return res
				.status(400)
				.setHeader("Content-Type", "text/html; charset=utf-8")
				.send(html);
		}

		const html = renderLogin({
			error: "An unknown error occurred"
		});
		return res
			.status(500)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
};
