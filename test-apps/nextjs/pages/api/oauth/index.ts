import { githubAuth } from "../../../lib/lucia";

import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";

type Data = {
	error?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
	if (req.method !== "GET" || !req.url) return res.status(404).end();
	if (!req.url) return res.status(400);
	const provider = req.query.provider;
	if (provider === "github") {
		const [url, state] = githubAuth.getAuthorizationUrl();
		const oauthStateCookie = cookie.serialize("oauth_state", state, {
			path: "/",
			maxAge: 60 * 60,
			httpOnly: true,
			secure: process.env.NODE_ENV !== "development"
		});
		return res
			.status(302)
			.setHeader("set-cookie", oauthStateCookie)
			.redirect(url);
	}
	return res.status(400).end();
};
