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
		if (!session.user.emailVerified) {
			return res.status(302).setHeader("Location", "/email-verification").end();
		}
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	}
	const html = renderPage({});
	return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

router.post("/login", async (req, res) => {
	const { email, password } = req.body as {
		email: unknown;
		password: unknown;
	};
	// basic check
	if (typeof email !== "string" || email.length < 1 || email.length > 255) {
		const html = renderPage({
			error: "Invalid email",
			email: typeof email === "string" ? email : ""
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
			email
		});
		return res
			.status(400)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
	try {
		// find user by key
		// and validate password
		const key = await auth.useKey("email", email.toLowerCase(), password);
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
				error: "Incorrect email or password",
				email
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

const renderPage = (params: { error?: string; email?: string }) => {
	const error = params.error ?? "";
	const email = params.email ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "login.html"))
		.toString("utf-8");
	html = html.replaceAll("%%error%%", error).replaceAll("%%email%%", email);
	return html;
};

export default router;
