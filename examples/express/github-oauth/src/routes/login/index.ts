import fs from "fs";
import path from "path";
import url from "url";
import express from "express";
import { auth } from "../../lucia.js";

import githubLoginRouter from "./github.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const router = express.Router();

router.use(githubLoginRouter);

router.get("/login", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	}
	const html = renderPage();
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

const renderPage = () => {
	const html = fs
		.readFileSync(path.join(__dirname, "index.html"))
		.toString("utf-8");
	return html;
};

export default router;
