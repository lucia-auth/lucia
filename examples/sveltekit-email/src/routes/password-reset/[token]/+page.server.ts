import { auth } from '$lib/server/lucia';
import { isValidPasswordResetToken, validatePasswordResetToken } from '$lib/server/tokens';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

export const load = async ({ params }) => {
	const validToken = await isValidPasswordResetToken(params.token);
	if (!validToken) throw redirect(302, '/password-reset');
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const password = formData.get('new-password');
		if (password instanceof File || !password) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			const userId = await validatePasswordResetToken(params.token);
			if (!userId) {
				return fail(400, {
					message: 'Invalid or expired token'
				});
			}
			let user = await auth.getUser(userId);
			if (!user.emailVerified) {
				user = await auth.updateUserAttributes(user.userId, {
					email_verified: true
				});
			}
			await auth.invalidateAllUserSessions(user.userId);
			await auth.updateKeyPassword('email', user.email, password);
			const session = await auth.createSession(user.userId, {
				attributes: {
					created_at: new Date()
				}
			});
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
