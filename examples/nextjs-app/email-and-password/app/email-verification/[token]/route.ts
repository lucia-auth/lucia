import { auth } from "@/auth/lucia";
import { validateEmailVerificationToken } from "@/auth/token";

import type { NextRequest } from "next/server";

export const GET = async (
	_: NextRequest,
	{
		params
	}: {
		params: {
			token: string;
		};
	}
) => {
	const { token } = params;
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
		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	} catch {
		return new Response("Invalid email verification link", {
			status: 400
		});
	}
};
