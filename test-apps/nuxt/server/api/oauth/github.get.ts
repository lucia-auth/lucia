export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const query = getQuery(event);
	const code = query.code?.toString() ?? null;
	const state = query.state?.toString() ?? null;
	const storedState = getCookie(event, "oauth_state");
	if (!code || !storedState || !state || storedState !== state) {
		return setResponseStatus(event, 400);
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
		return await sendRedirect(event, "/", 302);
	} catch {
		return setResponseStatus(event, 400);
	}
});
