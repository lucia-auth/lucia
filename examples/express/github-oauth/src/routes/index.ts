import fs from "fs";
import path from "path";
import url from "url";
import express from "express";
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
		githubUsername: session.user.githubUsername
	});
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

const renderPage = (params: { userId: string; githubUsername: string }) => {
	const userId = params.userId ?? "";
	const githubUsername = params.githubUsername ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "index.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%user_id%%", userId)
		.replaceAll("%%username%%", githubUsername);
	return html;
};

export default router;
