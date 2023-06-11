import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) {
		throw redirect(302, '/login');
	}
	if (!session.user.emailVerified) {
		throw redirect(302, '/email-verification');
	}
	return {
		session
	};
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return null;
		await auth.invalidateSession(session.sessionId);
		locals.auth.setSession(null);
	}
};
