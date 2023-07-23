import fs from "fs";
import path from "path";
import express from "express";
import url from "url";
import { SqliteError } from "better-sqlite3";

import { auth } from "../lucia.js";
import { isValidEmail, sendEmailVerificationLink } from "../email.js";
import { generateEmailVerificationToken } from "../token.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const router = express.Router();

router.get("/signup", async (req, res) => {
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

router.post("/signup", async (req, res) => {
	const { email, password } = req.body as {
		email: unknown;
		password: unknown;
	};
	// basic check
	if (!isValidEmail(email)) {
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
		password.length < 6 ||
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
		const user = await auth.createUser({
			key: {
				providerId: "email", // auth method
				providerUserId: email.toLowerCase(), // unique id when using "email" auth method
				password // hashed by Lucia
			},
			attributes: {
				email: email.toLowerCase(),
				email_verified: Number(false)
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(token);
		return res.status(302).setHeader("Location", "/email-verification").end();
	} catch (e) {
		// check for unique constraint error in user table
		if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
			const html = renderPage({
				error: "Account already exists",
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
		.readFileSync(path.join(__dirname, "signup.html"))
		.toString("utf-8");
	html = html.replaceAll("%%error%%", error).replaceAll("%%email%%", email);
	return html;
};

export default router;
