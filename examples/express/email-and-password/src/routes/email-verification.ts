import fs from "fs";
import path from "path";
import express from "express";
import url from "url";

import { auth } from "../lucia.js";
import {
	generateEmailVerificationToken,
	validateEmailVerificationToken
} from "../token.js";
import { sendEmailVerificationLink } from "../email.js";

const router = express.Router();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

router.get("/email-verification", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (!session) {
		return res.status(302).setHeader("Location", "/login").end();
	}
	if (session.user.emailVerified) {
		return res.status(302).setHeader("Location", "/").end();
	}
	const html = renderPage({});
	return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

router.post("/email-verification", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (!session) return res.status(302).setHeader("Location", "/login").end();
	if (session.user.emailVerified)
		return res.status(302).setHeader("Location", "/").end();
	try {
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(token);
		const html = renderPage({
			successMessage: "Your verification link was resent"
		});
		return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
	} catch {
		const html = renderPage({
			error: "An unknown error occurred"
		});
		return res
			.status(500)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
});

router.get("/email-verification/:token", async (req, res) => {
	const { token } = req.params;
	try {
		const userId = await validateEmailVerificationToken(token);
		const user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateUserAttributes(user.userId, {
			email_verified: Number(true)
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end();
	} catch {
		return res.status(400).send("Invalid email verification link");
	}
});

const renderPage = (params: { error?: string; successMessage?: string }) => {
	const error = params.error ?? "";
	const successMessage = params.successMessage ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "email-verification.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%error%%", error)
		.replaceAll("%%success_message%%", successMessage);
	return html;
};

export default router;
