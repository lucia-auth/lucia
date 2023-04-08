import { auth, emailVerificationToken } from "@auth/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const tokenParams = context.params.token ?? "";
	try {
		const token = await emailVerificationToken.validate(tokenParams);
		await auth.invalidateAllUserSessions(token.userId);
		await auth.updateUserAttributes(token.userId, {
			email_verified: true
		});
		const session = await auth.createSession(token.userId);
		const authRequest = auth.handleRequest(context);
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch (e) {
		console.log(e);
		return new Response(null, {
			status: 404
		});
	}
};
