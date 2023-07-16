import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { isValidPasswordResetToken, validatePasswordResetToken } from '$lib/server/token';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;
	const validToken = await isValidPasswordResetToken(token);
	if (!validToken) {
		throw redirect(302, '/password-reset');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const password = formData.get('password');
		// basic check
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			const { token } = params;
			const userId = await validatePasswordResetToken(token);
			let user = await auth.getUser(userId);
			await auth.invalidateAllUserSessions(user.userId);
			await auth.updateKeyPassword('email', user.email, password);
			if (!user.emailVerified) {
				user = await auth.updateUserAttributes(user.userId, {
					email_verified: Number(true)
				});
			}
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session);
		} catch (e) {
			return fail(400, {
				message: 'Invalid or expired password reset link'
			});
		}
		throw redirect(302, '/');
	}
};
