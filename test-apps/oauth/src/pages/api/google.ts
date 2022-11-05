import type { APIRoute } from "astro";
import { auth, googleAuth } from "../../lib/lucia";

export const get: APIRoute = async (request) => {
	const { existingUser, createUser, providerUser } = await googleAuth.validateCallback(
		request.url.searchParams.get("code") || ""
	);
	const user =
		existingUser ||
		(await createUser({
			username: providerUser.name
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
