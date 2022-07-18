import { RequestEvent } from "@sveltejs/kit";
import { Adapter } from "../types.js";
import { createBlankCookies } from "../utils/auth.js";
import { LuciaError } from "../utils/error.js";
import { ErrorResponse } from "./index.js";

export const handleLogoutRequest = async (
    event: RequestEvent,
    adapter: Adapter
) => {
    try {
        const refreshToken = event.locals.lucia?.refresh_token;
        if (!refreshToken) throw new LuciaError("REQUEST_UNAUTHORIZED");
        await adapter.deleteRefreshToken(refreshToken);
        const cookies = createBlankCookies();
        return new Response(null, {
            headers: {
                "set-cookie": cookies.join(","),
            },
        });
    } catch (e) {
        const error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
