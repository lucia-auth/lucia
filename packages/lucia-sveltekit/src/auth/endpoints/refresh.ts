import { LuciaError } from "../../utils/error.js";
import type { RequestEvent } from "../../kit.js";
import { ErrorResponse } from "./index.js";
import type { Context } from "../index.js";

export const handleRefreshRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const refreshToken = event.cookies.get("refresh_token");
        if (!refreshToken) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN")
        const session = await context.auth.refreshTokens(refreshToken)
        return new Response(null, {
            headers: {
                "set-cookie": session.cookies.join(","),
            },
        });
    } catch (e) {
        let error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
