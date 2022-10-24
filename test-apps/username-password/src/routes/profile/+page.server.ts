import { dev } from '$app/environment';
import { invalid, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals, parent }) => {
	const session = locals.getSession();
	if (!session) throw redirect(302, '/login');
	const notes = cookies.get('notes') || '';
	return {
		notes
	};
};

export const actions: Actions = {
	default: async ({ cookies, request, locals }) => {
		const session = locals.getSession();
		if (!session)
			return invalid(403, {
				error: 'Authentication required'
			});
		const formData = await request.formData();
		const notes = formData.get('notes')?.toString();
		if (notes === undefined)
			return invalid(400, {
				error: 'Invalid input'
			});
		cookies.set('notes', notes, {
			httpOnly: true,
			secure: !dev,
			path: '/'
		});
		return {
			success: true
		};
	}
};
