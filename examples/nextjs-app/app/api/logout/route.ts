import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
	const authRequest = auth.handleRequest({ request, cookies });
	const session = await authRequest.validate();
	if (!session) {
		return NextResponse.json(
			{
				error: "Unauthorized"
			},
			{
				status: 401
			}
		);
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	return new Response(null, {
		status: 302,
		headers: {
			location: "/login"
		}
	});
};
