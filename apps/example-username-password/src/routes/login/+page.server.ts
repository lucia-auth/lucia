import type { Action } from "@sveltejs/kit";
import { auth } from '$lib/lucia';

export const POST: Action = async ({request, setHeaders}) => {
    const form = await request.formData()
    const username = form.get("username")
    const password = form.get("password")
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
		return {
			errors: {
				message: 'Invalid input',
			}
		};
	}
	try {
		const authenticateUser = await auth.authenticateUser('username', username, password);
		setHeaders({
			'set-cookie': authenticateUser.cookies
		});
		return {
			location: "/profile"
		}
	} catch (e) {
		const error = e as Error;
		if (
			error.message === 'AUTH_INVALID_IDENTIFIER_TOKEN' ||
			error.message === 'AUTH_INVALID_PASSWORD'
		) {
			return {
				errors: {
                    message: 'Incorrect username or password.'
                }
			};
		}
		// database connection error
		return {
			status: 500,
			errors: {
                message: 'Unknown error.'
            }
		};
	}
}