import { LuciaError } from "lucia";

export default defineEventHandler(async (event) => {
	const { username, password } = await readBody<{
		username: unknown;
		password: unknown;
	}>(event);
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 1 ||
		username.length > 31
	) {
		throw createError({
			message: "Invalid username",
			statusCode: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		throw createError({
			message: "Invalid password",
			statusCode: 400
		});
	}
	try {
		// find user by key
		// and validate password
		const key = await auth.useKey("username", username.toLowerCase(), password);
		const session = await auth.createSession({
			userId: key.userId,
			attributes: {}
		});
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return sendRedirect(event, "/"); // redirect to profile page
	} catch (e) {
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			// user does not exist
			// or invalid password
			throw createError({
				message: "Incorrect username or password",
				statusCode: 400
			});
		}
		throw createError({
			message: "An unknown error occurred",
			statusCode: 500
		});
	}
});
