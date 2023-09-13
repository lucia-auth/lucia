import type { RequestHandler } from "@builder.io/qwik-city";

import { auth, githubAuth } from "~/auth/lucia";

export const onRequest: RequestHandler = async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (session) throw event.redirect(302, "/");
	const storedState = event.cookie.get("github_oauth_state")?.value;
	const state = event.query.get("state");
	const code = event.query.get("code");
	if (!storedState || !state || storedState !== state || !code) {
		throw event.error(400, "");
	}

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
	const newSession = await auth.createSession({
		userId: user.userId,
		attributes: {}
	});
	const { name, value, attributes } = auth.createSessionCookie(newSession);
	event.cookie.set(name, value, attributes);
	throw event.redirect(302, "/");
};
