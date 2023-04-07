import { auth, emailVerificationToken } from '$lib/auth/lucia';
import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const tokenParams = params.token;
	if (!tokenParams || tokenParams.length !== 43)
		return new Response(null, {
			status: 404
		});
	try {
		const token = await emailVerificationToken.validate(tokenParams);
		await auth.invalidateAllUserSessions(token.userId);
		await auth.updateUserAttributes(token.userId, {
			email_verified: true
		});
		const session = await auth.createSession(token.userId);
		locals.auth.setSession(session);
	} catch (e) {
		console.log(e);
		return new Response(null, {
			status: 404
		});
	}
	throw redirect(302, '/');
};
