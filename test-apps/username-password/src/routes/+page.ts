export const prerender = true

import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { lucia } = await parent();
    if (lucia) throw redirect(302, "/profile")
};
