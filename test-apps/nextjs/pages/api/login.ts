import { auth } from "../../auth/lucia";

import type { NextApiRequest, NextApiResponse } from "next";
import type { LuciaError } from "lucia-auth";

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
		const authRequest = auth.handleRequest({ req, res });
		const key = await auth.useKey("username", username, password);
		const session = await auth.createSession(key.userId);
		authRequest.setSession(session);
		return res.redirect(302, "/");
	} catch (e) {
		const error = e as LuciaError;
		if (
			error.message === "AUTH_INVALID_KEY_ID" ||
			error.message === "AUTH_INVALID_PASSWORD"
		) {
			return res.status(200).json({
				error: "Incorrect username or password"
			});
		}
		// database connection error
		console.log(error);
		return res.status(200).json({
			error: "Unknown error occurred"
		});
	}
};
