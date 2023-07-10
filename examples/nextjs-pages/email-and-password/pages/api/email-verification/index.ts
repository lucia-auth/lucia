import { sendEmailVerificationLink } from "@/auth/email";
import { auth } from "@/auth/lucia";
import { generateEmailVerificationToken } from "@/auth/verification-token";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405).end();
	const authRequest = auth.handleRequest({
		req,
		res
	});
	const session = await authRequest.validate();
	if (!session) return res.status(401).end();
	if (session.user.emailVerified) return res.status(422).end();
	try {
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(token);
		return res.status(200).end();
	} catch {
		return res.status(500).json({
			error: "An unknown error occurred"
		});
	}
};

export default handler;
