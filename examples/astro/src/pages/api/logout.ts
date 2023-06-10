import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
	const session = await context.locals.auth.validate();
	if (!session)
		return new Response(null, {
			status: 400
		});
	await auth.invalidateSession(session.sessionId);
	context.locals.auth.setSession(null);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/"
		}
	});
};
