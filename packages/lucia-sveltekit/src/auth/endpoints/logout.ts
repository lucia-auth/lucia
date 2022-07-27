import { RequestEvent } from "@sveltejs/kit";
import { LuciaError } from "../../utils/error.js";
import { createBlankCookies } from "../../utils/token.js";
import { Context } from "../index.js";
import { ErrorResponse } from "./index.js";

export const handleLogoutRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const refreshToken = event.locals.lucia?.refresh_token;
        if (!refreshToken) throw new LuciaError("REQUEST_UNAUTHORIZED");
        await context.adapter.deleteRefreshToken(refreshToken);
        const cookies = createBlankCookies(context.env);
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
