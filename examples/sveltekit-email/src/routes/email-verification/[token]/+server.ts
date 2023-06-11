import { redirect } from '@sveltejs/kit';
import { validateEmailVerificationToken } from '$lib/server/tokens';
import { auth } from '$lib/server/lucia';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const userId = await validateEmailVerificationToken(params.token);
	if (!userId) {
		return new Response('Invalid or expired token', {
			status: 422
		});
	}
	await auth.invalidateAllUserSessions(userId);
	await auth.updateUserAttributes(userId, {
		email_verified: true
	});
	const session = await auth.createSession(userId);
	locals.auth.setSession(session);
	throw redirect(302, '/');
};
