import { error, redirect } from '@sveltejs/kit';
import { getEmail } from '$lib/email';
import { prismaClient } from '$lib/db';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const email = await getEmail(params.email_id ?? '');
	if (!email) {
		throw error(404, {
			message: 'Not found'
		});
	}
	return {
		email
	};
};

export const actions: Actions = {
	default: async ({ params }) => {
		await prismaClient.email.delete({
			where: {
				id: params.email_id ?? ''
			}
		});
		throw redirect(302, '/email');
	}
};
