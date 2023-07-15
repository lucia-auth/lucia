import { isValidEmail, sendEmailVerificationLink } from "@/auth/email";
import { auth } from "@/auth/lucia";
import { generateEmailVerificationToken } from "@/auth/token";
import { SqliteError } from "better-sqlite3";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405);
	const { email, password } = req.body as {
		email: unknown;
		password: unknown;
	};
	// basic check
	if (!isValidEmail(email)) {
		return res.status(400).json({
			error: "Invalid email"
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		return res.status(400).json({
			error: "Invalid password"
		});
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
		const authRequest = auth.handleRequest({
			req,
			res
		});
		authRequest.setSession(session);
		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(token);
		return res.redirect(302, "/email-verification");
	} catch (e) {
		// check for unique constraint error in user table
		if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
			return res.status(400).json({
				error: "Account already exists"
			});
		}

		return res.status(500).json({
			error: "An unknown error occurred"
		});
	}
};

export default handler;
