import fs from "fs";
import path from "path";
import express from "express";
import url from "url";
import { LuciaError } from "lucia";

import { auth } from "../lucia.js";

const router = express.Router();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

router.get("/login", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	}
	const html = renderPage({});
	return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 1 ||
		username.length > 31
	) {
		const html = renderPage({
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
		const html = renderPage({
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
		const key = await auth.useKey("username", username.toLowerCase(), password);
		const session = await auth.createSession({
			userId: key.userId,
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
			// user does not exist
			// or invalid password
			const html = renderPage({
				error: "Incorrect username or password",
				username
			});
			return res
				.status(400)
				.setHeader("Content-Type", "text/html; charset=utf-8")
				.send(html);
		}

		const html = renderPage({
			error: "An unknown error occurred"
		});
		return res
			.status(500)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
});

const renderPage = (params: { error?: string; username?: string }) => {
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

export default router;
