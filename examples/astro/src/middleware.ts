import type { MiddlewareResponseHandler } from "astro";
import { auth } from "./lib/lucia";

export const onRequest: MiddlewareResponseHandler = async (context, next) => {
	context.locals.auth = auth.handleRequest(context);
	return await next();
};
