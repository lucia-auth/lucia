import type { Action } from "./$types"
import { auth } from '$lib/lucia';

export const POST: Action = async ({ request, setHeaders }) => {
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
		setHeaders({
			'set-cookie': createUser.cookies
		});
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
		return {
			status: 500,
			errors: {
				message: 'Unknown error',
				username: ''
			}
		};
	}
};
