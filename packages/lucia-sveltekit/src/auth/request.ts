import { LuciaError } from "../error.js";
import type { Context } from "./index.js";
import cookie from "cookie";
import { Session } from "../types.js";
import { Cookies } from "../kit.js";

type ParseRequest = (request: Request) => string;

export const parseRequestFunction = (context: Context) => {
    const parseRequest: ParseRequest = (request) => {
        const clonedReq = request.clone();
        const cookies = cookie.parse(clonedReq.headers.get("cookie") || "");
        const sessionId = cookies.auth_session || "";
        const checkForCsrf =
            clonedReq.method !== "GET" && clonedReq.method !== "HEAD";
        if (checkForCsrf && context.csrfProtection) {
            const origin = clonedReq.headers.get("Origin");
            const url = new URL(clonedReq.url);
            if (!origin) throw new LuciaError("AUTH_INVALID_REQUEST");
            if (url.origin !== origin)
                throw new LuciaError("AUTH_INVALID_REQUEST");
        }
        return sessionId;
    };
    return parseRequest;
};

type ValidateRequestEvent = (event: {
    request: Request;
    cookies: Cookies;
}) => Promise<Session>;

export const validateRequestEventFunction = (context: Context) => {
    const validateRequestEvent: ValidateRequestEvent = async ({ request, cookies }) => {
        const sessionId = context.auth.parseRequest(request);
        if (!sessionId) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        try {
            const session = await context.auth.validateSession(sessionId);
            return session;
        } catch (e) {
            const error = e as LuciaError;
            if (error.message !== "AUTH_INVALID_SESSION_ID") throw error;
        }
        const { session, setSessionCookie } = await context.auth.renewSession(
            sessionId
        );
        setSessionCookie(cookies)
        return session;
    };
    return validateRequestEvent;
};
