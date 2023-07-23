export default defineEventHandler(async (event) => {
	const { email } = await readBody<{
		email: unknown;
	}>(event);
	// basic check
	if (!isValidEmail(email)) {
		throw createError({ status: 400, message: "Invalid email" });
	}
	try {
		const storedUser = await db
			.selectFrom("user")
			.selectAll()
			.where("email", "=", email)
			.executeTakeFirst();
		if (!storedUser) {
			throw createError({ status: 400, message: "User does not exist" });
		}
		const user = auth.transformDatabaseUser(storedUser);
		const token = await generatePasswordResetToken(user.userId);
		await sendPasswordResetLink(token);
		return {};
	} catch (e) {
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
