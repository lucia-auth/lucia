import { auth, passwordResetToken } from '$lib/lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const password = formData.get('new-password');
		if (password instanceof File || password === null || password.length < 8) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			const token = await passwordResetToken.validate(params.token ?? '');
			let user = await auth.getUser(token.userId);
			if (!user.emailVerified) {
				user = await auth.updateUserAttributes(user.userId, {
					email_verified: true
				});
			}
			await auth.invalidateAllUserSessions(user.userId);
			await auth.updateKeyPassword('email', user.email, password);
			const session = await auth.createSession(user.userId);
			locals.auth.setSession(session);
		} catch (e) {
			console.log(e);
			return fail(400, {
				message: 'An unknown error occurred'
			});
		}
		throw redirect(302, '/');
	}
};
