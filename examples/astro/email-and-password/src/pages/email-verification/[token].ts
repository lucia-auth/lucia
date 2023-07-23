import { auth } from "../../lib/lucia";
import { validateEmailVerificationToken } from "../../lib/token";

import type { APIRoute } from "astro";

export const get: APIRoute = async ({ params, locals }) => {
	const { token } = params;
	if (!token) {
		return new Response(null, {
			status: 400
		});
	}
	try {
		const userId = await validateEmailVerificationToken(token);
		const user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateUserAttributes(user.userId, {
			email_verified: Number(true)
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		locals.auth.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch {
		return new Response("Invalid email verification link", {
			status: 400
		});
	}
};
