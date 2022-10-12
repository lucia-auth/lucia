import type { RequestEvent } from "../../kit.js";
import { createBlankCookies } from "../../utils/cookie.js";
import type { Context } from "../index.js";
import { ErrorResponse } from "./index.js";
import { LuciaError } from "../../error.js";

export const handleLogoutRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const { accessToken, refreshToken } = await context.auth.parseRequest(event.request)
        if (!accessToken) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN")
        await Promise.allSettled([
            context.adapter.deleteRefreshToken(refreshToken || ""),
            context.adapter.deleteSessionByAccessToken(accessToken),
        ]);
        return new Response(null, {
            headers: {
                "set-cookie": createBlankCookies(context.env === "PROD").join(","),
            },
        });
    } catch (e) {
        const error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
