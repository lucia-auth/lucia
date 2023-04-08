import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/lucia';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) {
		throw redirect(302, '/login');
	}
	if (!user.emailVerified) {
		throw redirect(302, '/email-verification');
	}
	return {
		user
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
