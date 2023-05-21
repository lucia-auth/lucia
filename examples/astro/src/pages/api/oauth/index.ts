import { githubAuth } from "../../../lib/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async ({ url, cookies }) => {
	const provider = url.searchParams.get("provider");
	if (provider === "github") {
		const [url, state] = await githubAuth.getAuthorizationUrl();
		cookies.set("oauth_state", state, {
			path: "/",
			maxAge: 60 * 60,
			httpOnly: true,
			secure: import.meta.env.PROD
		});
		return new Response(null, {
			status: 302,
			headers: {
				location: url.toString()
			}
		});
	}
	return new Response(null, {
		status: 400
	});
};
