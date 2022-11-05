import { Auth, Session } from "../types.js";
import { serialize } from "../utils/cookie.js";

type CreateSessionCookies = (session: Session) => string[];

export const createSessionCookiesFunction = (auth: Auth) => {
	const createSessionCookies: CreateSessionCookies = (session) => {
		return auth.configs.sessionCookieOptions.map((option) => {
			return serialize("auth_session", session.sessionId, {
				...option,
				httpOnly: true,
				expires: new Date(session.idlePeriodExpires),
				secure: auth.configs.env === "PROD"
			});
		});
	};
	return createSessionCookies;
};

type CreateBlankSessionCookies = () => string[];

export const createBlankSessionCookiesFunction = (auth: Auth) => {
	const createBlankSessionCookies: CreateBlankSessionCookies = () => {
		const options = [...auth.configs.sessionCookieOptions, ...auth.configs.deleteCookieOptions];
		return options.map((option) => {
			return serialize("auth_session", "", {
				...option,
				httpOnly: true,
				maxAge: 0,
				secure: auth.configs.env === "PROD"
			});
		});
	};
	return createBlankSessionCookies;
};
