import type { RequestEvent } from "../../kit.js";
import type { Context } from "../index.js";
import { ErrorResponse } from "./index.js";
import { LuciaError } from "../../error.js";

export const handleLogoutRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const sessionid = context.auth.parseRequest(event.request);
        if (!sessionid) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        await context.adapter.deleteSession(sessionid);
        context.auth.deleteAllCookies(event.cookies)
        return new Response(null);
    } catch (e) {
        const error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
