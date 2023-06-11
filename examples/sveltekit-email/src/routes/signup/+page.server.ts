import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import { generateEmailVerificationToken } from '$lib/server/tokens';
import { sendEmailVerificationLink } from '$lib/server/email';
import { LuciaError } from 'lucia';
import { Prisma } from '@prisma/client';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		if (!session.user.emailVerified) throw redirect(302, '/email-verification');
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() ?? '';
		if (email === null || !email.includes('@')) {
			return fail(400, {
				message: 'Invalid email',
				email
			});
		}
		const password = formData.get('password');
		if (password instanceof File || !password) {
			return fail(400, {
				message: 'Invalid password',
				email
			});
		}
		try {
			const user = await auth.createUser({
				key: {
					providerId: 'email',
					providerUserId: email,
					password
				},
				attributes: {
					email,
					email_verified: false
				}
			});
			const session = await auth.createSession(user.userId);
			locals.auth.setSession(session);
			const token = await generateEmailVerificationToken(user.userId);
			await sendEmailVerificationLink(token);
		} catch (e) {
			if (e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID') {
				return fail(400, {
					message: 'Email is already taken',
					email
				});
			}
			// duplication error
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
				return fail(400, {
					message: 'Email is already taken',
					email
				});
			}
			return fail(500, {
				message: 'An unknown error occurred',
				email
			});
		}
	}
};
