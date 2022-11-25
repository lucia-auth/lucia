import { AuthRequest } from "@lucia-auth/astro";
import { auth, googleAuth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async ({ url, request, cookies }) => {
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	if (state !== cookies.get("googleState").value || !code) {
		return new Response("Invalid state or code", {
			status: 400
		});
	}

	const { existingUser, createUser, providerUser } = await googleAuth.validateCallback(code);
	const user =
		existingUser ||
		(await createUser({
			username: providerUser.name
		}));
	const session = await auth.createSession(user.userId);
	const authRequest = new AuthRequest(auth, { request, cookies });
	authRequest.setSession(session);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/"
		}
	});
};
