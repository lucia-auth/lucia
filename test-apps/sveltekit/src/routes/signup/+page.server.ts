import { auth } from '$lib/server/lucia';
import { fail, type Actions } from '@sveltejs/kit';

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
			const user = await auth.createUser('username', username, {
				password,
				attributes: {
					username
				}
			});
			const session = await auth.createSession(user.userId);
			locals.setSession(session);
		} catch (e) {
			const error = e as Error;
			if (error.message === 'AUTH_DUPLICATE_PROVIDER_ID') {
				return fail(400, {
					message: 'Username already in use'
				});
			}
			console.error(error);
			return fail(500, {
				message: 'Unknown error occurred'
			});
		}
	}
};

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (session) throw redirect(302, '/');
	return {};
};