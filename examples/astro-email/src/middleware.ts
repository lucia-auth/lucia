import { auth } from "@auth/lucia";

import type { MiddlewareResponseHandler } from "astro";

export const onRequest: MiddlewareResponseHandler = async (context, next) => {
	context.locals.auth = auth.handleRequest(context);
	context.locals.isValidFormSubmission = () => {
		if (context.request.method !== "POST") return false;
		const originHeader = context.request.headers.get("Origin");
		if (!originHeader || originHeader !== new URL(context.request.url).origin) {
			return false;
		}
		return true;
	};
	return await next();
};
