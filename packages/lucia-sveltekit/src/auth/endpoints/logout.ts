import type { RequestEvent } from "../../kit.js";
import { createBlankCookies } from "../../utils/cookie.js";
import type { Context } from "../index.js";
import { ErrorResponse } from "./index.js";
import type { LuciaError } from "../../utils/error.js";

export const handleLogoutRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const session = await context.auth.validateRequest(event.request);
        const [accessToken] = session.accessToken;
        const [refreshToken] = session.refreshToken;
        await Promise.allSettled([
            context.adapter.deleteRefreshToken(refreshToken),
            context.adapter.deleteAccessToken(accessToken),
        ]);
        return new Response(null, {
            headers: {
                "set-cookie": createBlankCookies().join(","),
            },
        });
    } catch (e) {
        const error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
