import { LuciaError } from "../../error.js";
import type { RequestEvent } from "../../kit.js";
import { ErrorResponse } from "./index.js";
import type { Context } from "../index.js";

export const handleRefreshRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const { refreshToken } = await context.auth.parseRequest(event.request);
        if (!refreshToken) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const { session, tokens } = await context.auth.refreshSession(
            refreshToken
        );
        await context.auth.deleteExpiredUserSessions(session.userId);
        return new Response(null, {
            headers: {
                "set-cookie": tokens.cookies.join(","),
            },
        });
    } catch (e) {
        let error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
