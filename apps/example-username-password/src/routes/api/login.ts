import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/lucia';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const username = body.username;
	const password = body.password;
	if (!username || !password) {
		return {
			status: 400
		};
	}
	try {
		const authenticateUser = await auth.authenticateUser('username', username, password);
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
					error: 'Incorrect username or password.'
				})
			};
		}
		// database connection error
		return {
			status: 500,
			body: JSON.stringify({
				error: 'Unknown error.'
			})
		};
	}
};
