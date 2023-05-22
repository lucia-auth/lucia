export default defineEventHandler(async (event) => {
	const { provider } = getQuery(event);

	if (provider === "github") {
		const [url, state] = await githubAuth.getAuthorizationUrl();
		setCookie(event, "oauth_state", state, {
			path: "/",
			maxAge: 60 * 60,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production"
		});
		return await sendRedirect(event, url.toString(), 302);
	}
});
