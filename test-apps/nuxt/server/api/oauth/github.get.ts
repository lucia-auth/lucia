// Register an Authorization callback URL to this in dev: http://localhost:3000/api/oauth/github
// Use a different application in production with a real domain: https://example.com/api/oauth/github
export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const query = getQuery(event);
	const code = query.code?.toString();
	const state = query.state?.toString();
	const storedState = getCookie(event, "oauth_state");

	if (!code || !storedState || !state || storedState !== state) {
		throw createError({ statusCode: 400 });
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
		throw createError({ statusCode: 400 });
	}
});
