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
	const html = renderPage({
		userId: session.user.userId,
		username: session.user.username
	});
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

export const renderPage = (params: { userId: string; username: string }) => {
	const userId = params.userId ?? "";
	const username = params.username ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "index.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%user_id%%", userId)
		.replaceAll("%%username%%", username);
	return html;
};

export default router;
