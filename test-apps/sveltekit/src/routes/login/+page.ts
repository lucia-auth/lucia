import { redirect } from '@sveltejs/kit';
import { getUser } from '@lucia-auth/sveltekit/load';
import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {
	const user = await getUser(event);
	if (user) throw redirect(302, '/profile');
};
