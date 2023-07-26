import type { MiddlewareResponseHandler } from "astro";

export const onRequest: MiddlewareResponseHandler = async (_, next) => {
	const response = await next();
	const html = await response.text();
	const modifiedHtml = html.replaceAll("#C2C3C5", "#a8a8a8");
	return new Response(modifiedHtml, {
		headers: response.headers
	});
};
