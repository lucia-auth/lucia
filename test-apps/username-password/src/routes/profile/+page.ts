import { redirect } from '@sveltejs/kit';
import { getUser } from 'lucia-sveltekit/load';
import type { PageLoad } from './$types.js';

export const load: PageLoad = async (event) => {
	const user = await getUser(event);
	console.log(user);
	if (!user) throw redirect(302, '/login');
	return event.data;
};
