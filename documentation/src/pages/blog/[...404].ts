import type { APIRoute } from "astro";
import { error404 } from "src/utils/error";

export const get: APIRoute = (context) => {
	return error404(context.url);
};
