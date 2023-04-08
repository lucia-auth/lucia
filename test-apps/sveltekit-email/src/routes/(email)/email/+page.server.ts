import { getEmails } from '$lib/email';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const emailAddressQuery = url.searchParams.get('q') ?? '';
	const emails = await getEmails(emailAddressQuery);
	return {
		emails,
		emailAddressQuery
	};
};
