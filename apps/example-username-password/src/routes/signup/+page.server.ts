import { auth } from '$lib/lucia';
import type { Actions } from "@sveltejs/kit";
import { setCookie } from 'lucia-sveltekit';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = form.get('username');
		const password = form.get('password');
		if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
			return {
				errors: {
					message: 'Invalid input',
					username: ''
				}
			};
		}
		try {
			const createUser = await auth.createUser('username', username, {
				password,
				user_data: {
					username
				}
			});
			setCookie(cookies, ... createUser.cookies)
			return {
				location: "/profile"
			}
		} catch (e) {
			const error = e as Error;
			if (
				error.message === 'AUTH_DUPLICATE_IDENTIFIER_TOKEN' ||
				error.message === 'AUTH_DUPLICATE_USER_DATA'
			) {
				return {
					errors: {
						username: 'Username already taken',
						message: ''
					}
				};
			}
			console.error(error)
			return {
				status: 500,
				errors: {
					message: 'Unknown error',
					username: ''
				}
			};
		}
	}
}
