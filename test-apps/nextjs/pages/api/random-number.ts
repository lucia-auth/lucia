import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../../lib/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET")
		return res.status(404).json({
			error: "Not found"
		});
	const authRequest = new AuthRequest(auth, req, res);
	const session = await authRequest.getSession();
	if (!session)
		return res.status(401).json({
			error: "Unauthorized"
		});
	const number = Math.floor(Math.random() * 100);
	return res.status(200).json({
		number
	});
};
