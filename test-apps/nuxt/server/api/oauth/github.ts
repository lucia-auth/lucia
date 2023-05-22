export default defineEventHandler(async (event) => {
	const { req, res } = event.node;
	if (req.method !== "POST" || !req.url) {
		res.statusCode = 404;
		return res.end();
	}
	const authRequest = auth.handleRequest(event);
	const query = getQuery(event)
    const code = query.code?.toString() ?? null
	const state = query.state?.toString() ?? null
	const storedState = getCookie(event, "oauth_state");
	if (
        !code ||
		!storedState ||
		!state ||
		storedState !== state
	) {
		res.statusCode = 400;
		return res.end();
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			if (existingUser) return existingUser;
			return await createUser({
				username: providerUser.login
			});
		};
		const user = await getUser();
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
		return await sendRedirect(event, "/", 302)
	} catch {
		res.statusCode = 400;
		return res.end();
	}
});
