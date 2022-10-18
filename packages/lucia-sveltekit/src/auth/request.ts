import { LuciaError } from "../error.js";
import type { Context } from "./index.js";
import cookie from "cookie";
import { Session } from "../types.js";

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

type ValidateRequest = (request: Request) => Promise<Session>;

export const validateRequestFunction = (context: Context) => {
    const validateRequest: ValidateRequest = async (request) => {
        const sessionId = context.auth.parseRequest(request);
        const session = await context.auth.validateSession(sessionId);
        return session;
    };
    return validateRequest;
};
