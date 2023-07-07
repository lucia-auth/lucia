import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { SqliteError } from 'better-sqlite3';

import type { PageServerLoad, Actions } from './$types';
import { generateEmailVerificationToken } from '$lib/server/verification-token';
import { sendEmailVerificationLink } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		if (!session.user.emailVerified) throw redirect(302, '/email-verification');
		throw redirect(302, '/');
	}
	return {};
};

const emailRegexp = /^.+@.+$/ // [one or more character]@[one or more character]

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		// basic check
		if (typeof email !== 'string' || !emailRegexp.test(email)) {
			return fail(400, {
				message: 'Invalid email'
			});
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			const user = await auth.createUser({
				key: {
					providerId: 'email', // auth method
					providerUserId: email, // unique id when using "email" auth method
					password // hashed by Lucia
				},
				attributes: {
					email,
					email_verified: Number(false)
				}
			});
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
			const token = await generateEmailVerificationToken(user.userId)
			await sendEmailVerificationLink(token)
		} catch (e) {
			console.log(e)
			// check for unique constraint error in user table
			if (e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				return fail(400, {
					message: 'Account already exists'
				});
			}
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/email-verification');
	}
};
