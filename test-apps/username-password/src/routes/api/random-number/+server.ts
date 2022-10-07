import { auth } from '$lib/server/lucia';
import type { RequestHandler } from '@sveltejs/kit';
import { LuciaError } from 'lucia-sveltekit';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const { accessToken } = await auth.parseRequest(request);
		if (!accessToken) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN")
		await auth.getSession(accessToken)
		const number = Math.floor(Math.random() * 100);
		return new Response(
			JSON.stringify({
				number
			})
		);
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: 'Unauthorized'
			}),
			{
				status: 401
			}
		);
	}
};
