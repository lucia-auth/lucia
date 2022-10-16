import { LuciaError } from "../../error.js";
import type { RequestEvent } from "../../kit.js";
import { ErrorResponse } from "./index.js";
import type { Context } from "../index.js";

export const handleRenewRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const sessionId = context.auth.parseRequest(event.request);
        if (!sessionId) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const { session, setSessionCookie } = await context.auth.renewSession(sessionId);
        await context.auth.deleteDeadUserSessions(session.userId);
        setSessionCookie(event.cookies)
        return new Response(null);
    } catch (e) {
        let error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
