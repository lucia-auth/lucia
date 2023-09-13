import express from "express";
import { auth, githubAuth } from "../../lucia.js";
import { parseCookie } from "lucia/utils";
import { OAuthRequestError } from "@lucia-auth/oauth";

const router = express.Router();

router.get("/login/github", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		return res.status(302).setHeader("Location", "/").end();
	}
	const [url, state] = await githubAuth.getAuthorizationUrl();
	res.cookie("github_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60
	});
	return res.status(302).setHeader("Location", url.toString()).end();
});

router.get("/login/github/callback", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		return res.status(302).setHeader("Location", "/").end();
	}
	const cookies = parseCookie(req.headers.cookie ?? "");
	const storedState = cookies.github_oauth_state;
	const state = req.query.state;
	const code = req.query.code;
	// validate state
	if (
		!storedState ||
		!state ||
		storedState !== state ||
		typeof code !== "string"
	) {
		return res.sendStatus(400);
	}
	try {
		const { getExistingUser, githubUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			const existingUser = await getExistingUser();
			if (existingUser) return existingUser;
			const user = await createUser({
				attributes: {
					username: githubUser.login
				}
			});
			return user;
		};

		const user = await getUser();
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		authRequest.setSession(session);
		return res.status(302).setHeader("Location", "/").end();
	} catch (e) {
		if (e instanceof OAuthRequestError) {
			// invalid code
			return res.sendStatus(400);
		}
		return res.sendStatus(500);
	}
});

export default router;
