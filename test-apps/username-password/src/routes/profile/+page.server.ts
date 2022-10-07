import { dev } from '$app/environment';
import { auth } from '$lib/server/lucia';
import { invalid, redirect, type Actions } from '@sveltejs/kit';
import { LuciaError } from 'lucia-sveltekit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, request }) => {
	try {
		const { accessToken } = await auth.parseRequest(request);
		if (!accessToken) throw new LuciaError('AUTH_INVALID_ACCESS_TOKEN');
		await auth.getSession(accessToken);
		const notes = cookies.get('notes') || '';
		return {
			notes
		};
	} catch {
		throw redirect(302, '/login');
	}
};

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		try {
			const { accessToken } = await auth.parseRequest(request);
			if (!accessToken) throw new LuciaError('AUTH_INVALID_ACCESS_TOKEN');
			await auth.getSession(accessToken);
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
		} catch (e) {
			console.log(e);
			return invalid(403, {
				error: 'Authentication required'
			});
		}
	}
};
