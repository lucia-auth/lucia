import { createCookie } from "@remix-run/node";

export const oauthStateCookie = createCookie("oauth_state", {
	path: "/",
	maxAge: 60 * 60,
	httpOnly: true,
	secure: process.env.NODE_ENV === "production"
});
