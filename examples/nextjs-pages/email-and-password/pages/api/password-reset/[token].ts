import { auth } from "@/auth/lucia";
import { validatePasswordResetToken } from "@/auth/token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405).end();
	const { password } = req.body as {
		password: unknown;
	};
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return res.status(400).json({
			error: "Invalid password"
		});
	}
	try {
		const { token } = req.query as {
			token: string;
		};
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
		const authRequest = auth.handleRequest({
			req,
			res
		});
		authRequest.setSession(session);
		return res.end();
	} catch (e) {
		return res.status(400).json({
			error: "Invalid or expired password reset link"
		});
	}
};

export default handler;
