import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	const session = locals.getSession();
	if (!session)
		return new Response(
			JSON.stringify({
				error: 'Unauthorized'
			}),
			{
				status: 401
			}
		);
	const number = Math.floor(Math.random() * 100);
	return new Response(
		JSON.stringify({
			number
		})
	);
};
