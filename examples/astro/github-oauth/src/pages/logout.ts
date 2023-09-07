import { auth } from "../lib/lucia";

import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
	const session = await context.locals.auth.validate();
	if (!session) {
		return new Response("Unauthorized", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	context.locals.auth.setSession(null);
	return context.redirect("/login", 302);
};
