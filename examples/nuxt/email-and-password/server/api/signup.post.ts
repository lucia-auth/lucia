import { SqliteError } from "better-sqlite3";

export default defineEventHandler(async (event) => {
	const { email, password } = await readBody<{
		email: unknown;
		password: unknown;
	}>(event);
	// basic check
	if (!isValidEmail(email)) {
		throw createError({
			message: "Invalid email",
			statusCode: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		throw createError({
			message: "Invalid password",
			statusCode: 400
		});
	}
	try {
		const user = await auth.createUser({
			key: {
				providerId: "email", // auth method
				providerUserId: email.toLowerCase(), // unique id when using "email" auth method
				password // hashed by Lucia
			},
			attributes: {
				email: email.toLowerCase(),
				email_verified: Number(false)
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		const token = await generateEmailVerificationToken(user.userId);
		await sendEmailVerificationLink(token);
		return sendRedirect(event, "/email-verification");
	} catch (e) {
		// check for unique constraint error in user table
		if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
			throw createError({
				message: "Account already exists",
				statusCode: 400
			});
		}
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
