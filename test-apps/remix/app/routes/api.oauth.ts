import { oauthStateCookie } from "@auth/cookie.server";
import { githubAuth } from "@auth/lucia.server";
import { redirect } from "@remix-run/node";

import type { LoaderArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderArgs) => {
	const url = new URL(request.url);
	const provider = url.searchParams.get("provider");
	if (provider === "github") {
		const [authorizationUrl, state] = await githubAuth.getAuthorizationUrl();
		return redirect(authorizationUrl.toString(), {
			headers: {
				"Set-Cookie": await oauthStateCookie.serialize(state)
			}
		});
	}
	return new Response(null, {
		status: 400
	});
};
