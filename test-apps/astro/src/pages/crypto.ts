import type { APIRoute } from "astro";
// import "lucia-auth/polyfill/node";

export const get: APIRoute = async () => {
	return new Response(
		JSON.stringify(
			{
				"crypto.getRandomValues": !!crypto.getRandomValues,
				"crypto.randomUUID": !!crypto.randomUUID,
				"crypto.subtle": !!crypto.subtle
			},
			null,
			2
		)
	);
};
