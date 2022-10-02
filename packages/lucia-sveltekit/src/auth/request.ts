import { LuciaError } from "../utils/error.js";
import type { Context } from "./index.js";
import cookie from "cookie";
import type { ServerSession } from "../types.js";
import {
    createAccessTokenCookie,
    createRefreshTokenCookie,
} from "../utils/token.js";

type ValidateRequest = (request: Request) => Promise<ServerSession>;

export const validateRequestFunction = (context: Context) => {
    const validateRequest: ValidateRequest = async (request) => {
        const clonedReq = request.clone();
        const cookies = cookie.parse(clonedReq.headers.get("cookie") || "");
        const refreshToken = cookies.refresh_token;
        const accessToken = cookies.access_token;
        if (!refreshToken) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        if (!accessToken) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const session = await context.auth.validateAccessToken(accessToken);
        const accessTokenCookie = createAccessTokenCookie(
            accessToken,
            session.expires,
            context
        );
        const refreshTokenCookie = createRefreshTokenCookie(
            refreshToken,
            context
        );
        return {
            ...session,
            accessToken: [accessToken, accessTokenCookie],
            refreshToken: [refreshToken, refreshTokenCookie],
            cookies: [accessTokenCookie, refreshTokenCookie],
        };
    };
    return validateRequest;
};
