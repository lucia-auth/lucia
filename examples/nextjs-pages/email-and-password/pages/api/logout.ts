import { auth } from "@/auth/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") return res.status(405);
	const authRequest = auth.handleRequest({ req, res });
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return res.status(401).send("Unauthorized");
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	authRequest.setSession(null);
	return res.redirect(302, "/login");
};

export default handler;
