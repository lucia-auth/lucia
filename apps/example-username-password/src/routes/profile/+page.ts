import { redirect } from '@sveltejs/kit';
import { getSession } from 'lucia-sveltekit/load';
import type { PageLoad } from './$types.js';

export const load: PageLoad = async (event) => {
	const session = await getSession(event);
	if (!session) throw redirect(302, '/login');
	return event.data;
}
