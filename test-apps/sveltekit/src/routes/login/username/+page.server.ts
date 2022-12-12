import { fail, type Actions } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get('username');
		const password = form.get('password');
		if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
			return fail(400, {
				message: 'Invalid input'
			});
		}
		try {
			const user = await auth.authenticateUser('username', username, password);
			const session = await auth.createSession(user.userId);
			locals.setSession(session);
		} catch (e) {
			const error = e as Error;
			if (
				error.message === 'AUTH_INVALID_PROVIDER_ID' ||
				error.message === 'AUTH_INVALID_PASSWORD'
			) {
				return fail(400, {
					message: 'Incorrect username or password.'
				});
			}
			// database connection error
			console.error(error);
			return fail(500, {
				message: 'Unknown error occurred'
			});
		}
	}
};