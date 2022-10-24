import { LuciaError, type Auth } from "lucia-auth";
import type { RequestEvent } from "../../types.js";
import { ErrorResponse } from "./index.js";

export const handleLogoutRequest = async (event: RequestEvent, auth: Auth) => {
	try {
		const sessionid = auth.parseRequest(event.request);
		if (!sessionid) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		await auth.configs.adapter.deleteSession(sessionid);
		event.locals.clearSession();
		return new Response(null);
	} catch (e) {
		const error = e as LuciaError;
		return new ErrorResponse(error);
	}
};
