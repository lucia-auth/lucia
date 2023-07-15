import { auth } from "@/auth/lucia";
import { validateEmailVerificationToken } from "@/auth/token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET") return res.status(405).end();
	const { token } = req.query as {
		token: string;
	};
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
		const authRequest = auth.handleRequest({
			req,
			res
		});
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end();
	} catch {
		return res.status(400).send("Invalid email verification link");
	}
};

export default handler;
