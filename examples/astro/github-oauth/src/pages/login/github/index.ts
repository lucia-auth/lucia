import type { APIRoute } from "astro";
import { githubAuth } from "../../../lib/lucia";

export const get: APIRoute = async ({ cookies, locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	}
	const [url, state] = await githubAuth.getAuthorizationUrl();
	cookies.set('github_oauth_state', state, {
		httpOnly: true,
		secure: !import.meta.env.DEV,
		path: '/',
		maxAge: 60 * 60
	});
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
};
