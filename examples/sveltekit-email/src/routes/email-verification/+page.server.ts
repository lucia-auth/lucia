import { generateEmailVerificationToken } from '$lib/server/tokens';
import { sendEmailVerificationLink } from '$lib/server/email';
import { redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (!session) {
		throw redirect(302, '/login');
	}
	if (session.user.emailVerified) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) {
			throw redirect(302, '/login');
		}
		if (!session.user.emailVerified) {
			throw redirect(302, '/');
		}
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(token);
	}
};
