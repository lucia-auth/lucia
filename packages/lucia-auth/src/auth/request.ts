import { LuciaError } from "../error.js";
import cookie from "cookie";
import type { Auth, Session, MinimalRequest, User } from "../types.js";

type ParseRequest = (request: MinimalRequest) => string;

export const parseRequestFunction = (auth: Auth) => {
	const parseRequest: ParseRequest = (request) => {
		const cookies = cookie.parse(request.headers.get("cookie") || "");
		const sessionId = cookies.auth_session || "";
		const checkForCsrf = request.method !== "GET" && request.method !== "HEAD";
		if (checkForCsrf && auth.configs.csrfProtection) {
			const origin = request.headers.get("Origin");
			const url = new URL(request.url);
			if (!origin) throw new LuciaError("AUTH_INVALID_REQUEST");
			if (url.origin !== origin) throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		return sessionId;
	};
	return parseRequest;
};

type ValidateRequest = (
	request: MinimalRequest,
	setCookie: (cookie: string) => void
) => Promise<Session>;

export const validateRequestFunction = (auth: Auth) => {
	const validateRequest: ValidateRequest = async (request, setCookie) => {
		const sessionId = auth.parseRequest(request);
		try {
			const session = await auth.validateSession(sessionId);
			return session;
		} catch (validateError) {
			if (!(validateError instanceof LuciaError)) throw validateError;
			try {
				const renewedSession = await auth.renewSession(sessionId);
				await auth.deleteDeadUserSessions(renewedSession.userId);
				const sessionCookies = auth.createSessionCookies(renewedSession);
				setCookie(sessionCookies.toString());
				return renewedSession;
			} catch (renewError) {
				const blankSessionCookies = auth.createBlankSessionCookies();
				setCookie(blankSessionCookies.toString());
				throw renewError;
			}
		}
	};
	return validateRequest;
};

type GetSessionUserFromRequest = (
	request: MinimalRequest,
	setCookie: (cookie: string) => void
) => Promise<{
	user: User;
	session: Session;
}>;

export const getSessionUserFromRequestFunction = (auth: Auth) => {
	const getSessionUserFromRequest: GetSessionUserFromRequest = async (request, setCookie) => {
		const sessionId = auth.parseRequest(request);
		try {
			return await auth.getSessionUser(sessionId);
		} catch (validateError) {
			if (!(validateError instanceof LuciaError)) throw validateError;
			try {
				const renewedSession = await auth.renewSession(sessionId);
				const serializedCookies = auth.createSessionCookies(renewedSession);
				setCookie(serializedCookies.toString());
				const [user] = await Promise.all([
					auth.getUser(renewedSession.userId),
					auth.deleteDeadUserSessions(renewedSession.userId)
				]);
				return { user, session: renewedSession };
			} catch (renewError) {
				if (validateError instanceof LuciaError) {
					setCookie(auth.createBlankSessionCookies().toString());
				}
				throw renewError;
			}
		}
	};
	return getSessionUserFromRequest;
};
