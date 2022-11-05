import type { APIRoute } from "astro";
import { auth, githubAuth } from "../../lib/lucia";

export const get: APIRoute = async (request) => {
	const { existingUser, createUser, providerUser } = await githubAuth.validateCallback(
		request.url.searchParams.get("code") || ""
	);
	const user =
		existingUser ||
		(await createUser({
			username: providerUser.login
		}));
	const session = await auth.createSession(user.userId);
	const serializedCookies = auth.createSessionCookies(session);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/",
			"set-cookie": serializedCookies.toString()
		}
	});
};
