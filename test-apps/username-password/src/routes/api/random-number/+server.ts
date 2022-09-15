import { auth } from '$lib/lucia.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	try {
		await auth.validateRequest(request);
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
