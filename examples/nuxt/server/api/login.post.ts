import { LuciaError } from "lucia-auth";

export default defineEventHandler(async (event) => {
	const { username, password } = (await readBody(event)) ?? {};
	if (!username || !password) {
		return {
			error: "Invalid input"
		};
	}
	try {
		const authRequest = auth.handleRequest(event);
		const key = await auth.useKey("username", username, password);
		const session = await auth.createSession(key.userId);
		authRequest.setSession(session);
		return null;
	} catch (error) {
		if (
			error instanceof LuciaError &&
			(error.message === "AUTH_INVALID_KEY_ID" ||
				error.message === "AUTH_INVALID_PASSWORD")
		) {
			throw createError({
				message: "Incorrect username or password",
				statusCode: 400
			});
		}
		throw createError({
			message: "An unknown error occurred",
			statusCode: 400
		});
	}
});
