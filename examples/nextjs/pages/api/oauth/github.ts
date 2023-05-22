import { auth, githubAuth } from "../../../auth/lucia";
import cookie from "cookie";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET" || !req.url) return res.status(404).end();
	const authRequest = auth.handleRequest({ req, res });
	const code = req.query.code?.toString() ?? null;
	const state = req.query.state?.toString() ?? null;
	const { oauth_state: storedState } = cookie.parse(req.headers.cookie || "");
	if (!code || !storedState || !state || storedState !== state) {
		return res.status(400).end();
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			if (existingUser) return existingUser;
			return await createUser({
				username: providerUser.login
			});
		};
		const user = await getUser();
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
		return res.status(302).redirect("/");
	} catch {
		return res.status(500).end();
	}
};
