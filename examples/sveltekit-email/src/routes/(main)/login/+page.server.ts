import { auth } from '$lib/lucia';
import { emailRegex } from '$lib/form-submission';
import { LuciaError } from 'lucia-auth';
import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (user) {
		if (!user.emailVerified) throw redirect(302, '/email-verification');
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() ?? '';
		if (email === null || !emailRegex.test(email)) {
			return fail(400, {
				message: 'Incorrect email or password',
				email
			});
		}
		const password = formData.get('password');
		if (password instanceof File || password === null) {
			return fail(400, {
				message: 'Incorrect email or password',
				email
			});
		}
		try {
			const key = await auth.useKey('email', email, password);
			const session = await auth.createSession(key.userId);
			locals.auth.setSession(session);
		} catch (e) {
			if (e instanceof LuciaError && e.message === 'AUTH_INVALID_KEY_ID') {
				return fail(400, {
					message: 'Incorrect email or password',
					email
				});
			}
			if (e instanceof LuciaError && e.message === 'AUTH_INVALID_PASSWORD') {
				return fail(400, {
					message: 'Incorrect email or password',
					email
				});
			}
			return fail(400, {
				message: 'An unknown error occurred',
				email
			});
		}
		throw redirect(302, '/');
	}
};
