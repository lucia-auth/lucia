import { LuciaError } from "lucia-auth";
import { ErrorResponse } from "./index.js";
export const handleLogoutRequest = async (event, auth) => {
    try {
        const sessionid = auth.parseRequest(event.request);
        if (!sessionid)
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        await auth.configs.adapter.deleteSession(sessionid);
        event.locals.clearSession();
        return new Response(null);
    }
    catch (e) {
        const error = e;
        return new ErrorResponse(error);
    }
};
