import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../../lib/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
	error?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
	if (req.method !== "POST")
		return res.status(404).json({ error: "Not found" });
	const { username, password } =
		typeof req.body === "string" ? JSON.parse(req.body) : req.body;
	if (!username || !password) {
		return res.status(200).json({
			error: "Invalid input"
		});
	}
	try {
		const authRequest = new AuthRequest(auth, req, res);
		const user = await auth.authenticateUser("username", username, password);
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
		return res.redirect(302, "/");
	} catch (e) {
		const error = e as Error;
		if (
			error.message === "AUTH_INVALID_PROVIDER_ID" ||
			error.message === "AUTH_INVALID_PASSWORD"
		) {
			return res.status(200).json({
				error: "Incorrect username or password"
			});
		}
		// database connection error
		console.error(error);
		return res.status(200).json({
			error: "Unknown error occurred"
		});
	}
};
