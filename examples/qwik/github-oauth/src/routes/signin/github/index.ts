import type { RequestHandler } from "@builder.io/qwik-city";

import { githubAuth } from "~/auth/lucia";

export const onGet: RequestHandler = async (event) => {
	const [url, state] = await githubAuth.getAuthorizationUrl();
	event.cookie.set("github_oauth_state", state, {
		httpOnly: true,
		secure: false,
		path: "/",
		maxAge: 60 * 60
	});
	throw event.redirect(302, url.toString());
};
