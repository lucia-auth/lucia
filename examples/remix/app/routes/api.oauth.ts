import { oauthStateCookie } from "@auth/cookie";
import { githubAuth } from "@auth/lucia.server";

import { redirect, type LoaderArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderArgs) => {
	const url = new URL(request.url);
	const provider = url.searchParams.get("provider");
	if (provider === "github") {
		const [url, state] = await githubAuth.getAuthorizationUrl();
		return redirect(url.toString(), {
			headers: {
				"Set-Cookie": await oauthStateCookie.serialize(state)
			}
		});
	}
	return new Response(null, {
		status: 400
	});
};
