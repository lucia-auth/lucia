import { auth } from "../../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
	error?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
	if (req.method !== "POST") return res.status(404).json({ error: "Not found" });
	const { username, password } = JSON.parse(req.body);
	if (!username || !password || typeof username !== "string" || typeof password !== "string") {
		return res.status(200).json({
			error: "Invalid input"
		});
	}
	try {
		const user = await auth.createUser("username", username, {
			password,
			attributes: {
				username
			}
		});
		const session = await auth.createSession(user.userId);
		const authRequest = new AuthRequest(auth, req, res);
		authRequest.setSession(session);
		return res.redirect(302, "/profile");
	} catch (e) {
		const error = e as Error;
		if (error.message === "AUTH_DUPLICATE_PROVIDER_ID") {
			return res.status(200).json({
				error: "Username already in use"
			});
		}
		// database connection error
		console.error(error);
		return res.status(200).json({
			error: "Unknown error occurred"
		});
	}
};
