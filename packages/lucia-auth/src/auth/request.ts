import { LuciaError } from "../error.js";
import { parse } from "../utils/cookie.js";
import type { Auth, MinimalRequest } from "../types.js";

type ValidateRequestHeaders = (request: MinimalRequest) => string;

export const validateRequestHeadersFunction = (auth: Auth) => {
	const validateRequestHeaders: ValidateRequestHeaders = (request) => {
		const cookies = parse(request.headers.get("cookie") || "");
		const sessionId = cookies.auth_session || "";
		const checkForCsrf = request.method !== "GET" && request.method !== "HEAD";
		if (checkForCsrf && auth.configs.csrfProtection) {
			const origin = request.headers.get("Origin");
			if (!origin) throw new LuciaError("AUTH_INVALID_REQUEST");
			const url = new URL(request.url);
			if (url.origin !== origin) throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		return sessionId;
	};
	return validateRequestHeaders;
};
