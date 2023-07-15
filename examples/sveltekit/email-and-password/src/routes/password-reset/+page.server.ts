import { auth } from '$lib/server/lucia';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { generatePasswordResetToken } from '$lib/server/token';
import { isValidEmail, sendPasswordResetLink } from '$lib/server/email';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		// basic check
		if (!isValidEmail(email)) {
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
