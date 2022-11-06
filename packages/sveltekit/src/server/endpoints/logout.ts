import type { Auth } from "lucia-auth";
import type { RequestEvent } from "../../types.js";

export const handleLogoutRequest = async (event: RequestEvent, auth: Auth) => {
	try {
		const sessionid = auth.parseRequest(event.request);
		if (!sessionid) return new Response(null);
		await auth.invalidateSession(sessionid);
		event.locals.setSession(null);
		return new Response(null);
	} catch {
		return new Response(
			JSON.stringify({
				message: "error"
			}),
			{
				status: 500
			}
		);
	}
};
