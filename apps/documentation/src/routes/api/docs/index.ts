import docs from '$lib/docs.js';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({url}) => {
	return {
		body: JSON.stringify(docs.map((doc) => doc.pathname))
	};
};
