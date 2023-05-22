export default defineEventHandler(async (event) => {
	const { req, res } = event.node;
	if (req.method !== "GET" || !req.url) {
		res.statusCode = 404;
		return res.end();
	}
	const searchParams = new URLSearchParams(req.url.split("?").at(1));
	const provider = searchParams.get("provider");
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
	res.statusCode = 400;
	return res.end();
});
