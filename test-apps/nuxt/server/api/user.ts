export default defineEventHandler(async (event) => {
	if (event.node.req.method !== "GET") {
		event.node.res.statusCode = 404;
		return sendError(event, new Error("Not found"));
	}
	const authRequest = auth.handleRequest(event);
	const { user } = await authRequest.validateUser();
	return { user };
});
