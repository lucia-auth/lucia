import { AuthRequest } from "@lucia-auth/nextjs";
import { auth, githubAuth } from "../../../lib/lucia";

import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";

type Data = {
	error?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
	if (req.method !== "GET" || !req.url) return res.status(404).end();
	const authRequest = new AuthRequest(auth, req, res);
	const code = req.query.code;
	const state = req.query.state;
	const { oauth_state: storedState } = cookie.parse(req.headers.cookie || "");
	if (typeof code !== "string" || typeof code !== "string" || storedState !== state)
		return res.status(400).end();
	try {
		const { existingUser, providerUser, createUser } = await githubAuth.validateCallback(code);
		const user =
			existingUser ??
			(await createUser({
				username: providerUser.login
			}));
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
		return res.status(302).redirect("/");
	} catch {
		return res.status(500).end();
	}
};
