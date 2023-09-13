import { auth } from "@/auth/lucia";
import * as context from "next/headers";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
	const authRequest = auth.handleRequest(request.method, context);
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return new Response("Unauthorized", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	authRequest.setSession(null);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/login" // redirect to login page
		}
	});
};
