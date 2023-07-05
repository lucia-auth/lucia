import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
	const authRequest = auth.handleRequest({ request, cookies });
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return NextResponse.json(
			{
				error: "Not authenticated"
			},
			{
				status: 401
			}
		);
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
