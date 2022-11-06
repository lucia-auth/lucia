import { Auth, Session } from "../types.js";
import { Cookie } from "../utils/cookie.js";

type CreateSessionCookies = (session: Session | null) => Cookie[];

export const createSessionCookiesFunction = (auth: Auth) => {
	const createSessionCookies: CreateSessionCookies = (session) => {
		if (session) {
			return auth.configs.sessionCookieOptions.map((option) => {
				return new Cookie("auth_session", session.sessionId, {
					...option,
					httpOnly: true,
					expires: new Date(session.idlePeriodExpires),
					secure: auth.configs.env === "PROD"
				});
			});
		}
		return [...auth.configs.sessionCookieOptions, ...auth.configs.deleteCookieOptions].map(
			(option) => {
				return new Cookie("auth_session", "", {
					...option,
					httpOnly: true,
					maxAge: 0,
					secure: auth.configs.env === "PROD"
				});
			}
		);
	};
	return createSessionCookies;
};
