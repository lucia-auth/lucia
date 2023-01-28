import { redirect, type Actions, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) throw redirect(302, '/login');
	return {};
};

export const actions: Actions ={
	default: async ({locals}) => {
		const session = await locals.validate();
		if (!session) throw fail(401)
		await auth.invalidateSession(session.sessionId);
		locals.setSession(null);
	}
}