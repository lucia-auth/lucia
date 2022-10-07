import { LuciaError } from "../utils/error.js";
import type { Context } from "./index.js";
import cookie from "cookie";
import { Session } from "../types.js";

type ParseRequest = (request: Request) => Promise<{
    accessToken: string | null,
    refreshToken: string | null
}>;

export const parseRequestFunction = (context: Context) => {
    const parseRequest: ParseRequest = async (request) => {
        const clonedReq = request.clone();
        const cookies = cookie.parse(clonedReq.headers.get("cookie") || "");
        const refreshToken = cookies.refresh_token || null;
        const accessToken = cookies.access_token || null;
        const checkForCsrf = clonedReq.method !== "GET" && clonedReq.method !== "HEAD"
        if (checkForCsrf && context.addCsrfProtection) {
            const origin = clonedReq.headers.get("Origin");
            const url = new URL(clonedReq.url);
            if (!origin) throw new LuciaError("AUTH_INVALID_REQUEST");
            if (url.origin !== origin)
                throw new LuciaError("AUTH_INVALID_REQUEST");
        }
        return {
            accessToken,
            refreshToken
        }
    };
    return parseRequest;
};

type ValidateRequest = (request: Request) => Promise<Session>

export const validateRequestFunction = (context:Context) => {
    const validateRequest: ValidateRequest = async (request) => {
        const { accessToken } = await context.auth.parseRequest(request)
        if (!accessToken) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN")
        const session = await context.auth.validateAccessToken(accessToken)
        return session
    }
    return validateRequest
}