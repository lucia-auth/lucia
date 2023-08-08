export default defineEventHandler(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) {
		throw createError({
			message: "Unauthorized",
			status: 401
		});
	}
	if (session.user.emailVerified) {
		throw createError({
			status: 422,
			message: "Email already verified"
		});
	}
	try {
		const token = await generateEmailVerificationToken(session.user.userId);
		await sendEmailVerificationLink(token);
		return {};
	} catch {
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
