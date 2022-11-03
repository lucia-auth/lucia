import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../../lib/lucia";
import cookie from "cookie";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST")
		return res.status(404).json({
			error: "Not found"
		});
	const authRequest = new AuthRequest(auth, req, res);
	const session = await authRequest.getSession();
	if (!session)
		return res.status(401).json({
			error: "Unauthorized"
		});
	const { notes } = JSON.parse(req.body);
	if (!notes)
		return res.status(400).json({
			error: "Invalid input"
		});
	return res
		.setHeader(
			"set-cookie",
			cookie.serialize("notes", notes, {
				httpOnly: true,
				secure: false,
				path: "/"
			})
		)
		.status(200)
		.json({});
};
