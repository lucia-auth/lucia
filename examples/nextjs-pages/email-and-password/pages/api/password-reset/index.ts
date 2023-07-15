import { db } from "@/auth/db";
import { isValidEmail, sendPasswordResetLink } from "@/auth/email";
import { auth } from "@/auth/lucia";
import { generatePasswordResetToken } from "@/auth/token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405).end();
	const { email } = req.body as {
		email: unknown;
	};
	// basic check
	if (!isValidEmail(email)) {
		return res.status(400).json({
			error: "Invalid email"
		});
	}
	try {
		const storedUser = await db
			.selectFrom("user")
			.selectAll()
			.where("email", "=", email)
			.executeTakeFirst();
		if (!storedUser) {
			return res.status(400).json({
				error: "User does not exist"
			});
		}
		const user = auth.transformDatabaseUser(storedUser);
		const token = await generatePasswordResetToken(user.userId);
		await sendPasswordResetLink(token);
		return res.end();
	} catch (e) {
		return res.status(500).json({
			error: "An unknown error occurred"
		});
	}
};

export default handler;
