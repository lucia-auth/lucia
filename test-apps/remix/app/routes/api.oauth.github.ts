import { oauthStateCookie } from "@auth/cookie";
import { auth, githubAuth } from "@auth/lucia.server";

import { redirect, type LoaderArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderArgs) => {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = await oauthStateCookie.parse(
		request.headers.get("Cookie") ?? ""
	);
	if (!storedState || storedState !== state || !code || !state) {
		return new Response(null, { status: 401 });
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);
		const user =
			existingUser ??
			(await createUser({
				username: providerUser.login
			}));
		const session = await auth.createSession(user.userId);
		const headers = new Headers();
		const authRequest = auth.handleRequest(request, headers);
		authRequest.setSession(session);
		return redirect("/", {
			headers
		});
	} catch (e) {
		return new Response(null, {
			status: 500
		});
	}
};
