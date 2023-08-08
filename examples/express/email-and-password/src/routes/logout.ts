import express from "express";

import { auth } from "../lucia.js";

const router = express.Router();

router.post("/logout", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (!session) {
		return res.status(401).send("Unauthorized");
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	// redirect back to login page
	return res.status(302).setHeader("Location", "/login").end();
});

export default router;
