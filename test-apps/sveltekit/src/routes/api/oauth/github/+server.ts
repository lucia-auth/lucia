import { auth, githubAuth } from '$lib/server/lucia';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';

export const GET: RequestHandler = async ({ cookies, url, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	if (!storedState || storedState !== state || !code || !state) {
		return new Response(null, { status: 401 });
	}
	try {
		const { existingUser, providerUser, createUser } = await githubAuth.validateCallback(code);
		const user =
			existingUser ??
			(await createUser({
				username: providerUser.login
			}));
		const session = await auth.createSession(user.userId);
		locals.auth.setSession(session);
	} catch (e) {
		return new Response(null, {
			status: 500
		});
	}
	throw redirect(302, '/');
};
