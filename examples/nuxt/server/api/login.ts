import { LuciaError } from "lucia-auth";

export default defineEventHandler(async (event) => {
	if (event.node.req.method !== "POST") {
		event.node.res.statusCode = 404;
		return sendError(event, new Error());
	}
	const parsedBody = await readBody(event);
	if (!parsedBody || typeof parsedBody !== "object") return;
	const username = parsedBody.username;
	const password = parsedBody.password;
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
		return send(event, null);
	} catch (error) {
		if (
			error instanceof LuciaError &&
			(error.message === "AUTH_INVALID_KEY_ID" ||
				error.message === "AUTH_INVALID_PASSWORD")
		) {
			return {
				error: "Incorrect username or password"
			};
		}
		// database connection error
		console.log(error);
		return {
			error: "An unknown error occurred"
		};
	}
});
