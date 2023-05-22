export default defineEventHandler(async (event) => {
	console.log(event.node.req.method);
	if (event.node.req.method !== "POST") {
		event.node.res.statusCode = 404;
		return sendError(event, new Error());
	}
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) {
		event.node.res.statusCode = 401;
		return {
			error: "Unauthorized"
		};
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	return send(event, null);
});
