import type { Actions } from "@sveltejs/kit";
import { auth } from '$lib/lucia.js';
import { setCookie } from "lucia-sveltekit";

export const actions: Actions = {
	default: async ({request, cookies}) => {
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
			const userSession = await auth.authenticateUser('username', username, password);
			setCookie(cookies, ...userSession.cookies)
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
			console.error(error)
			return {
				status: 500,
				errors: {
					message: 'Unknown error.'
				}
			};
		}
	}
}