import { auth, appleAuth } from "@/auth/lucia";
import { cookies, headers } from "next/headers";

import type { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
	const authRequest = auth.handleRequest(request.method, {
		cookies,
		headers
	});
	const session = await authRequest.validate();
	if (session) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	}
	const [url, state] = await appleAuth.getAuthorizationUrl();
	const cookieStore = cookies();
	cookieStore.set("apple_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60
	});
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
};
