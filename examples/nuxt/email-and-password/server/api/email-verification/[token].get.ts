export default defineEventHandler(async (event) => {
	const { token } = event.context.params ?? {
		token: ""
	};
	try {
		const userId = await validateEmailVerificationToken(token);
		const user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateUserAttributes(user.userId, {
			email_verified: Number(true)
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return sendRedirect(event, "/");
	} catch {
		throw createError({
			status: 400,
			message: "Invalid email verification link"
		});
	}
});
