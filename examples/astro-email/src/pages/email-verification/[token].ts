import { auth } from "@auth/lucia";
import { validateEmailVerificationToken } from "@auth/tokens";

import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const tokenParams = context.params.token ?? "";
	const userId = await validateEmailVerificationToken(tokenParams);
	if (!userId) {
		return new Response("Invalid or expired token", {
			status: 422
		});
	}
	await auth.invalidateAllUserSessions(userId);
	await auth.updateUserAttributes(userId, {
		email_verified: true
	});
	const session = await auth.createSession(userId);
	context.locals.auth.setSession(session);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/"
		}
	});
};
