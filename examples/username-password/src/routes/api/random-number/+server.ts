import { auth } from '$lib/server/lucia';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	try {
		await auth.validateRequestEvent(event)
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
