import { auth, githubAuth } from "../../../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";
import type { APIRoute } from "astro";

export const get: APIRoute = async ({ cookies, url, request }) => {
	const authRequest = new AuthRequest(auth, { cookies, request });
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies.get("oauth_state").value;
	if (storedState !== state || !code || !state) throw new Response(null, { status: 401 });
	try {
		const { existingUser, providerUser, createUser } = await githubAuth.validateCallback(code);
		const user =
			existingUser ??
			(await createUser({
				username: providerUser.login
			}));
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch {
		return new Response(null, {
			status: 500
		});
	}
};
