export default defineEventHandler(async (event) => {
	const { password } = await readBody<{
		password: unknown;
	}>(event);
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		throw createError({ status: 400, message: "Invalid password" });
	}
	try {
		const { token } = event.context.params ?? {
			token: ""
		};
		const userId = await validatePasswordResetToken(token);
		let user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateKeyPassword("email", user.email, password);
		if (!user.emailVerified) {
			user = await auth.updateUserAttributes(user.userId, {
				email_verified: Number(true)
			});
		}
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return {};
	} catch (e) {
		throw createError({
			message: "Invalid or expired password reset link",
			statusCode: 400
		});
	}
});
