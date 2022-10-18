import { auth } from '$lib/server/lucia';
import { invalid, redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = form.get('username');
		const password = form.get('password');
		if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
			return invalid(400, {
				message: 'Invalid input'
			});
		}
		try {
			const user = await auth.createUser('username', username, {
				password,
				attributes: {
					username
				}
			});
			const { setSessionCookie } = await auth.createSession(user.userId);
			setSessionCookie(cookies)
		} catch (e) {
			const error = e as Error;
			if (
				error.message === 'AUTH_DUPLICATE_PROVIDER_ID' ||
				error.message === 'AUTH_DUPLICATE_USER_DATA'
			) {
				return invalid(400, {
					message: 'Username already in use'
				});
			}
			console.error(error);
			return invalid(500, {
				message: 'Unknown error occurred'
			});
		}
		throw redirect(302, '/profile');
	}
};
