import { LuciaError } from "../error.js";
import cookie from "cookie";
import type { Auth, Session } from "../types.js";

type ParseRequest = (request: Request) => string;

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

type ValidateRequest = (request: Request) => Promise<Session>;

export const validateRequestFunction = (auth: Auth) => {
	const validateRequest: ValidateRequest = async (request) => {
		const sessionId = auth.parseRequest(request);
		try {
			const session = await auth.validateSession(sessionId);
			return session;
		} catch (e) {
			if (e instanceof LuciaError) {
				const renewedSession = await auth.renewSession(sessionId);
				await auth.deleteDeadUserSessions(renewedSession.userId);
				return renewedSession;
			}
			throw e;
		}
	};
	return validateRequest;
};
