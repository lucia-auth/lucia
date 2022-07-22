import { auth } from '$lib/lucia.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	try {
		await auth.validateRequest(request);
		const number = Math.floor(Math.random() * 100);
		return {
			body: JSON.stringify({
				number
			})
		};
	} catch (e) {
		return {
			status: 401,
			body: JSON.stringify({
				error: 'unauthorized'
			})
		};
	}
};
