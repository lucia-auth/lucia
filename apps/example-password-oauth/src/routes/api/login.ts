import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/lucia';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const email = form.get('email')?.toString();
	const password = form.get('password')?.toString();
	if (!email || !password) {
		return {
			status: 400
		};
	}
	try {
		const authenticateUser = await auth.authenticateUser('email', email, password);
		return {
			headers: {
				'set-cookie': authenticateUser.cookies
			},
			body: JSON.stringify({
				error: 'success'
			})
		};
	} catch (e) {
		const error = e as Error;
		if (
			error.message === 'AUTH_INVALID_IDENTIFIER_TOKEN' ||
			error.message === 'AUTH_INVALID_PASSWORD'
		) {
			return {
				status: 400,
				body: JSON.stringify({
					error: 'Incorrect email or password.'
				})
			};
		}
		return {
			status: 500,
			body: JSON.stringify({
				error: 'Unknown error.'
			})
		};
	}
};
