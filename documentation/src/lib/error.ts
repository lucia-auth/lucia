export const error404 = async (url: URL) => {
	const response = await fetch(`${url.origin}/404`);
	return new Response(response.body, {
		status: 404,
		headers: {
			"Content-Type": "text/html"
		}
	});
};
