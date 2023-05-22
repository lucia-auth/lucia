export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) {
		setResponseStatus(event, 401);
		return {
			error: "Unauthorized"
		};
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	return null; // returns 204
});
