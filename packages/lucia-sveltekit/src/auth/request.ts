import { LuciaError } from "../utils/error.js";
import type { Context } from "./index.js";
import cookie from "cookie";

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
