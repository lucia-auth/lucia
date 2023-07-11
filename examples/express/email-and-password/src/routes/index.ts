import fs from "fs";
import path from "path";
import express from "express";
import url from "url";

import { auth } from "../lucia.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const router = express.Router();

router.get("/", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (!session) {
		// redirect to login page
		return res.status(302).setHeader("Location", "/login").end();
	}
	if (!session.user.emailVerified) {
		return res.status(302).setHeader("Location", "/email-verification").end();
	}
	const html = renderPage({
		userId: session.user.userId,
		email: session.user.email
	});
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

export const renderPage = (params: { userId: string; email: string }) => {
	const userId = params.userId ?? "";
	const email = params.email ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "index.html"))
		.toString("utf-8");
	html = html.replaceAll("%%user_id%%", userId).replaceAll("%%email%%", email);
	return html;
};

export default router;
