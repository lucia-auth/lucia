import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = async (Astro) => {
	const authRequest = auth.handleRequest(Astro);
	const session = await authRequest.validate();
	if (!session)
		return new Response(null, {
			status: 400
		});
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/"
		}
	});
};
