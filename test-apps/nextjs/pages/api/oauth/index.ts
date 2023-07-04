import { githubAuth } from "../../../auth/lucia";
import cookie from "cookie";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET" || !req.url) return res.status(404).end();
	if (!req.url) return res.status(400);
	const provider = req.query.provider;
	if (provider === "github") {
		const [url, state] = await githubAuth.getAuthorizationUrl();
		const oauthStateCookie = cookie.serialize("oauth_state", state, {
			path: "/",
			maxAge: 60 * 60,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production"
		});
		return res
			.status(302)
			.setHeader("set-cookie", oauthStateCookie)
			.redirect(url.toString());
	}
	return res.status(400).end();
};
