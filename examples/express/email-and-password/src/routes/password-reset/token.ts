import fs from "fs";
import path from "path";
import express from "express";
import url from "url";

import { auth } from "../../lucia.js";
import {
	isValidPasswordResetToken,
	validatePasswordResetToken
} from "../../token.js";

const router = express.Router();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

router.get("/password-reset/:token", async (req, res) => {
	const { token } = req.params;
	const validToken = await isValidPasswordResetToken(token);
	if (!validToken) {
		return res.status(302).setHeader("Location", "/password-reset").end();
	}
	const html = renderPage({});
	return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

router.post("/password-reset/:token", async (req, res) => {
	const { password } = req.body as {
		password: unknown;
	};
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		const html = renderPage({
			error: "Invalid password"
		});
		return res
			.status(400)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
	try {
		const { token } = req.params;
		const userId = await validatePasswordResetToken(token);
		let user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateKeyPassword("email", user.email, password);
		if (!user.emailVerified) {
			user = await auth.updateUserAttributes(user.userId, {
				email_verified: Number(true)
			});
		}
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end();
	} catch (e) {
		const html = renderPage({
			error: "Invalid or expired password reset link"
		});
		return res
			.status(400)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
});

const renderPage = (params: { error?: string }) => {
	const error = params.error ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "token.html"))
		.toString("utf-8");
	html = html.replaceAll("%%error%%", error);
	return html;
};

export default router;
