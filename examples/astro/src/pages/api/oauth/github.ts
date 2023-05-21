import { auth, githubAuth } from "../../../lib/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const authRequest = auth.handleRequest(context);
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("oauth_state").value;
	if (!storedState || storedState !== state || !code || !state) {
		return new Response(null, { status: 401 });
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);
		const getUser = async () => {
			if (existingUser) return existingUser;
			return await createUser({
				username: providerUser.login
			});
		};
		const user = await getUser();
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
