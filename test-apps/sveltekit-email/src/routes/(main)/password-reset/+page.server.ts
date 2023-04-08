import { sendPasswordResetEmail } from '$lib/email';
import { auth, passwordResetToken } from '$lib/lucia';
import { prismaClient } from '$lib/db';
import { emailRegex } from '$lib/form-submission';
import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() ?? '';
		if (email === null || !emailRegex.test(email)) {
			return fail(400, {
				message: 'Invalid email',
				email
			});
		}
		try {
			const databaseUser = await prismaClient.authUser.findFirst({
				where: {
					email: email
				}
			});
			if (!databaseUser) {
				return fail(400, {
					message: 'Email does not exist',
					email
				});
			}
			const user = auth.transformDatabaseUser(databaseUser);
			const token = await passwordResetToken.issue(user.userId);
			await sendPasswordResetEmail(user.email, token.toString());
			return {
				success: true
			};
		} catch (e) {
			console.log(e);
			return fail(500, {
				message: 'An unknown error occurred',
				email
			});
		}
	}
};
