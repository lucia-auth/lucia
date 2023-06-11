import { sendPasswordResetLink } from '$lib/server/email';
import { generatePasswordResetToken } from '$lib/server/tokens';
import { prismaClient } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() ?? '';
		if (email === null || !email.includes('@')) {
			return fail(400, {
				message: 'Invalid email',
				email
			});
		}
		try {
			const databaseUser = await prismaClient.user.findFirst({
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
			const userId = databaseUser.id;
			const token = await generatePasswordResetToken(userId);
			await sendPasswordResetLink(token);
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
