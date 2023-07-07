import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { generatePasswordResetToken } from '$lib/server/verification-token';
import { sendPasswordResetLink } from '$lib/server/email';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		if (!session.user.emailVerified) throw redirect(302, '/email-verification');
		throw redirect(302, '/');
	}
	return {};
};

const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		// basic check
		if (typeof email !== 'string' || !emailRegexp.test(email)) {
			return fail(400, {
				message: 'Invalid email'
			});
		}
		try {
			const storedUser = await db
				.selectFrom('user')
				.selectAll()
				.where('email', '=', email)
				.executeTakeFirst();
			if (!storedUser) {
				return fail(400, {
					message: 'User does not exist'
				});
			}
			const user = auth.transformDatabaseUser(storedUser);
			const token = await generatePasswordResetToken(user.userId);
			await sendPasswordResetLink(token);
			return {
				success: true
			};
		} catch (e) {
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
	}
};
