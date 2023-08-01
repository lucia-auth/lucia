import fs from "fs";
import path from "path";
import express from "express";
import url from "url";

import { auth } from "../../lucia.js";
import { isValidEmail, sendPasswordResetLink } from "../../email.js";
import { generatePasswordResetToken } from "../../token.js";
import { db } from "../../db.js";

import tokenRouter from "./token.js";

const router = express.Router();

router.use(tokenRouter);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

router.get("/password-reset", async (req, res) => {
	const html = renderPage({});
	return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

router.post("/password-reset", async (req, res) => {
	const { email } = req.body as {
		email: unknown;
	};
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
	try {
		const storedUser = await db
			.selectFrom("user")
			.selectAll()
			.where("email", "=", email)
			.executeTakeFirst();
		if (!storedUser) {
			const html = renderPage({
				email: email.toLowerCase(),
				error: "User does not exist"
			});
			return res
				.status(400)
				.setHeader("Content-Type", "text/html; charset=utf-8")
				.send(html);
		}
		const user = auth.transformDatabaseUser(storedUser);
		const token = await generatePasswordResetToken(user.userId);
		await sendPasswordResetLink(token);
		const html = renderPage({
			successMessage: "Your password reset link was sent to your inbox"
		});
		return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
	} catch (e) {
		const html = renderPage({ error: "An unknown error occurred" });
		return res
			.status(500)
			.setHeader("Content-Type", "text/html; charset=utf-8")
			.send(html);
	}
});

const renderPage = (params: {
	email?: string;
	error?: string;
	successMessage?: string;
}) => {
	const email = params.email ?? "";
	const error = params.error ?? "";
	const successMessage = params.successMessage ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "index.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%email%%", email)
		.replaceAll("%%error%%", error)
		.replaceAll("%%success_message%%", successMessage);
	return html;
};

export default router;
