import { githubAuth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
	const url = new URL(request.url);
	const provider = url.searchParams.get("provider");
	if (provider === "github") {
		const [authorizationUrl, state] = await githubAuth.getAuthorizationUrl();
		cookies().set("oauth_state", state, {
			path: "/",
			maxAge: 60 * 60,
			httpOnly: true
		});
		return NextResponse.redirect(authorizationUrl.toString());
	}
	return new Response(null, {
		status: 400
	});
};
